import type { NextApiRequest, NextApiResponse } from 'next'
import { createDefaultElevenLabsClient } from '../../../lib/elevenlabs'

type AdminStats = {
  leads: {
    total: number
    today: number
    thisWeek: number
    conversionRate: number
  }
  conversations: {
    total: number
    today: number
    avgDuration: string
    successRate: number
  }
  system: {
    uptime: string
    webhookStatus: 'active' | 'inactive' | 'error'
    dbStatus: 'connected' | 'disconnected' | 'error'
    lastBackup: string
  }
}

function secondsToHMM(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<AdminStats | { error: string }>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || ''
    const isProd = !!process.env.VERCEL
    const proto = forwardedProto || (isProd ? 'https' : 'http')
    const host = req.headers.host || 'localhost:3000'
    const origin = `${proto}://${host}`

    const convResp = await fetch(`${origin}/api/conversations-list?limit=200`).catch(() => null as any)
    if (!convResp || !convResp.ok) {
      // Fallback: try localhost http in case of proxy scheme issues
      const fallbackOrigin = 'http://localhost:3000'
      const fallbackResp = await fetch(`${fallbackOrigin}/api/conversations-list?limit=200`).catch(() => null as any)
      if (fallbackResp && fallbackResp.ok) {
        const convJson = await fallbackResp.json()
        return res.status(200).json(await buildStats(convJson, origin))
      }
      // Direct ElevenLabs fallback
      const direct = await fetchConversationsDirect()
      return res.status(200).json(await buildStats({ conversations: direct }, origin))
    }
    const convJson = await convResp.json()
    return res.status(200).json(await buildStats(convJson, origin))
  } catch (error) {
    console.error('admin/stats error', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function buildStats(convJson: any, origin: string): Promise<AdminStats> {
  const conversations: any[] = Array.isArray(convJson?.conversations) ? convJson.conversations : []
  const startOfToday = new Date(); startOfToday.setHours(0,0,0,0)
  const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - 7)

  // Дотягиваем lead_info через детали, если отсутствует
  const enriched = await Promise.all(
    conversations.map(async (c) => {
      if (c.lead_info) return c
      try {
        const d = await fetch(`${origin}/api/conversation-details?conversation_id=${c.id || c.conversation_id}`)
        if (d.ok) {
          const dj = await d.json()
          if (dj?.lead_info) {
            return { ...c, lead_info: dj.lead_info, duration_seconds: dj.duration_seconds || c.duration_seconds }
          }
        }
      } catch {}
      return c
    })
  )

  const totalConversations = enriched.length
  const conversationsToday = conversations.filter(c => {
    const ts = (c.start_time || c.start_time_unix_secs || 0) * 1000
    return ts >= startOfToday.getTime()
  }).length

  const leads = enriched
    .map(c => ({
      id: c.id || c.conversation_id,
      lead_info: c.lead_info,
      start_time: c.start_time || c.start_time_unix_secs || 0
    }))
    .filter(l => !!l.lead_info)

  const leadsTotal = leads.length
  const leadsToday = leads.filter(l => (l.start_time * 1000) >= startOfToday.getTime()).length
  const leadsThisWeek = leads.filter(l => (l.start_time * 1000) >= startOfWeek.getTime()).length

  const totalDurationSeconds = enriched.reduce((sum, c) => sum + (c.duration_seconds || c.call_duration_secs || 0), 0)
  const avgDurationSeconds = totalConversations > 0
    ? Math.round(totalDurationSeconds / totalConversations)
    : 0

  const successTotal = enriched.filter(c => c.call_successful === 'success').length
  const successRate = totalConversations > 0 ? Math.round((successTotal / totalConversations) * 100) : 0

  return {
    leads: {
      total: leadsTotal,
      today: leadsToday,
      thisWeek: leadsThisWeek,
      conversionRate: totalConversations > 0 ? Math.round((leadsTotal / totalConversations) * 100) : 0
    },
    conversations: {
      total: totalConversations,
      today: conversationsToday,
      avgDuration: secondsToHMM(avgDurationSeconds),
      successRate,
      // Доп поле — суммарная длительность для UI
      // @ts-ignore
      totalDuration: secondsToHMM(totalDurationSeconds)
    },
    system: {
      uptime: '—',
      webhookStatus: 'active',
      dbStatus: 'disconnected',
      lastBackup: '—'
    }
  }
}

async function fetchConversationsDirect(): Promise<any[]> {
  const client = createDefaultElevenLabsClient()
  const list = await client.listConversations({ page_size: 200 })
  if (!list.success || !list.data?.conversations) return []
  const base = list.data.conversations

  return Promise.all(
    base.map(async (c: any) => {
      let leadInfo: any = null
      try {
        const detail = await client.getConversation(c.conversation_id)
        if (detail.success && detail.data) {
          const rawTranscript = (detail.data as any).transcript
          const transcript = Array.isArray(rawTranscript)
            ? rawTranscript.map((m: any) => (typeof m === 'string' ? m : m?.content || '')).join(' ')
            : (rawTranscript || '') as string
          // Regex patterns similar to conversations-list
          const phonePatterns = [
            /\+375\s*\(?\d{2}\)?\s*\d{3}[- ]?\d{2}[- ]?\d{2}/g,
            /375\s*\(?\d{2}\)?\s*\d{3}[- ]?\d{2}[- ]?\d{2}/g,
            /\+375\s*(\d{9})/g,
            /375\s*(\d{9})/g
          ]
          const namePatterns = [
            /меня зовут\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
            /я\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
            /имя\s+([а-яё]+(?:\s+[а-яё]+)?)/i
          ]
          let phoneMatch: RegExpExecArray | null = null
          for (const p of phonePatterns) { phoneMatch = p.exec(transcript); if (phoneMatch) break }
          let nameMatch: RegExpExecArray | null = null
          for (const p of namePatterns) { nameMatch = p.exec(transcript); if (nameMatch) break }
          if (phoneMatch || nameMatch) {
            leadInfo = {
              name: nameMatch ? nameMatch[1].trim() : 'Неизвестно',
              phone: phoneMatch ? phoneMatch[0].trim() : 'Не указан',
              extracted_from: 'transcript'
            }
          }
        }
      } catch {}

      return {
        id: c.conversation_id,
        agent_id: c.agent_id,
        status: c.status,
        call_successful: (c as any).call_successful || null,
        start_time: c.start_time_unix_secs,
        duration_seconds: c.call_duration_secs,
        lead_info: leadInfo
      }
    })
  )
}
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'
import { createDefaultElevenLabsClient } from '../../../lib/elevenlabs'
import { ApiLogger } from '../../../lib/api-logger'

interface EnhancedLeadData {
  // Basic contact info
  name?: string
  phone?: string
  email?: string
  
  // Enhanced data
  sentiment?: 'positive' | 'neutral' | 'negative'
  intent?: string[]
  urgency?: 'low' | 'medium' | 'high'
  budget_mentioned?: boolean
  timeline_mentioned?: boolean
  
  // Conversation context
  conversation_duration?: number
  language?: string
  topics?: string[]
}

interface WebhookPayload {
  transcript: string
  conversationId?: string
  agentId?: string
  metadata?: any
  
  // ElevenLabs specific fields
  eleven_labs_conversation_id?: string
  conversation_end_reason?: string
  conversation_duration_secs?: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now()
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    await ApiLogger.log({
      serviceName: 'enhanced-webhook',
      endpoint: '/api/webhook/voice-lead-enhanced',
      method: req.method || 'UNKNOWN',
      statusCode: 405,
      responseTimeMs: Date.now() - startTime,
      errorMessage: 'Method not allowed'
    })
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🎯 Enhanced webhook received payload:', JSON.stringify(req.body, null, 2))

    const payload: WebhookPayload = req.body
    const { 
      transcript, 
      conversationId, 
      agentId, 
      metadata,
      eleven_labs_conversation_id,
      conversation_end_reason,
      conversation_duration_secs
    } = payload

    if (!transcript) {
      await ApiLogger.log({
        serviceName: 'enhanced-webhook',
        endpoint: '/api/webhook/voice-lead-enhanced',
        method: 'POST',
        statusCode: 400,
        responseTimeMs: Date.now() - startTime,
        errorMessage: 'Transcript is required'
      })
      return res.status(400).json({ error: 'Transcript is required' })
    }

    // Step 1: Try to find existing conversation data
    let conversationData = null
    if (eleven_labs_conversation_id) {
      console.log('🔍 Looking for conversation with ElevenLabs ID:', eleven_labs_conversation_id)
      
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('eleven_labs_conversation_id', eleven_labs_conversation_id)
        .single()
      
      if (existingConversation) {
        conversationData = existingConversation
        console.log('✅ Found existing conversation:', conversationData.id)
      }
    }

    // Step 2: Enhanced contact extraction using AI analysis
    const enhancedData = await extractEnhancedLeadData(transcript, conversationData)
    
    if (!enhancedData.name && !enhancedData.phone && !enhancedData.email) {
      console.log('⚠️ No contact information extracted')
             await ApiLogger.log({
         serviceName: 'enhanced-webhook',
         endpoint: '/api/webhook/voice-lead-enhanced',
         method: 'POST',
         statusCode: 200,
         responseTimeMs: Date.now() - startTime,
         metadata: { processed: false, reason: 'no_contact_info' }
       })
      
      return res.status(200).json({ 
        message: 'No contact information found in transcript',
        processed: false,
        analysis: enhancedData
      })
    }

    // Step 3: Calculate enhanced lead quality score
    const qualityScore = calculateEnhancedLeadScore(enhancedData, transcript, conversationData)

    // Step 4: Prepare enhanced lead data
    const leadData = {
      client_id: 'default-client',
      agent_id: agentId || 'agent_2001k4cgbmjhebd92cbzn8fk2zmk',
      conversation_id: conversationData?.id || conversationId || null,
      source_conversation_id: conversationData?.id || null,
      
      // Contact information (structured)
      contact_info: JSON.stringify({
        name: enhancedData.name,
        phone: enhancedData.phone,
        email: enhancedData.email
      }),
      
      // Enhanced fields
      conversation_summary: generateConversationSummary(transcript, enhancedData),
      extracted_entities: {
        ...enhancedData,
        extraction_method: 'enhanced_ai_analysis',
        extracted_at: new Date().toISOString()
      },
      lead_quality_score: qualityScore,
      
      // Basic fields
      source: 'voice_widget_enhanced',
      status: 'NEW',
      score: Math.round(qualityScore), // Backward compatibility
      notes: transcript,
      metadata: JSON.stringify({
        eleven_labs_conversation_id,
        conversation_end_reason,
        conversation_duration_secs,
        enhanced_analysis: true,
        original_metadata: metadata,
        processed_at: new Date().toISOString()
      })
    }

    // Step 5: Create enhanced lead in database
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select(`
        id, 
        contact_info, 
        conversation_summary, 
        extracted_entities, 
        lead_quality_score,
        source,
        status,
        score,
        created_at
      `)
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Step 6: Log successful API call
    await ApiLogger.log({
      serviceName: 'enhanced-webhook',
      endpoint: '/api/webhook/voice-lead-enhanced',
      method: 'POST',
      statusCode: 200,
      responseTimeMs: Date.now() - startTime,
      metadata: {
        lead_id: newLead.id,
        quality_score: qualityScore,
        has_conversation_data: !!conversationData,
        extracted_entities_count: Object.keys(enhancedData).length
      }
    })

    console.log('✅ Enhanced lead captured:', {
      id: newLead.id,
      quality_score: qualityScore,
      extracted: enhancedData
    })

    return res.status(200).json({
      success: true,
      lead: newLead,
      enhanced_analysis: enhancedData,
      quality_score: qualityScore,
      conversation_data: conversationData ? {
        id: conversationData.id,
        duration: conversationData.duration,
        sentiment: conversationData.sentiment_score,
        topics: conversationData.topics
      } : null
    })

  } catch (error) {
    console.error('❌ Enhanced webhook error:', error)
    
    await ApiLogger.log({
      serviceName: 'enhanced-webhook',
      endpoint: '/api/webhook/voice-lead-enhanced',
      method: 'POST',
      statusCode: 500,
      responseTimeMs: Date.now() - startTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function extractEnhancedLeadData(
  transcript: string, 
  conversationData?: any
): Promise<EnhancedLeadData> {
  const data: EnhancedLeadData = {}
  const text = transcript.toLowerCase()

  // Basic contact extraction (improved patterns)
  data.name = extractName(transcript)
  data.phone = extractPhone(transcript)
  data.email = extractEmail(transcript)

  // Enhanced analysis
  data.sentiment = analyzeSentiment(transcript)
  data.intent = extractIntent(transcript)
  data.urgency = analyzeUrgency(transcript)
  data.budget_mentioned = checkBudgetMention(transcript)
  data.timeline_mentioned = checkTimelineMention(transcript)

  // Use conversation data if available
  if (conversationData) {
    data.conversation_duration = conversationData.duration
    data.language = conversationData.language
    data.topics = conversationData.topics
    if (conversationData.sentiment_score !== null) {
      // Override with more accurate ElevenLabs sentiment if available
      data.sentiment = conversationData.sentiment_score > 0.6 ? 'positive' 
                     : conversationData.sentiment_score < 0.4 ? 'negative' 
                     : 'neutral'
    }
  }

  return data
}

function extractName(transcript: string): string | undefined {
  const namePatterns = [
    /меня зовут\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
    /я\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
    /имя\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
    /меня звать\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
    /представлюсь\s+([а-яё]+(?:\s+[а-яё]+)?)/i
  ]

  for (const pattern of namePatterns) {
    const match = pattern.exec(transcript)
    if (match) {
      const name = match[1].trim()
      return name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    }
  }
  return undefined
}

function extractPhone(transcript: string): string | undefined {
  const phonePatterns = [
    /\+375\s*\(?(\d{2})\)?\s*(\d{3})[- ]?(\d{2})[- ]?(\d{2})/g,
    /8\s*\(?0(\d{2})\)?\s*(\d{3})[- ]?(\d{2})[- ]?(\d{2})/g,
    /(\d{3})[- ]?(\d{2})[- ]?(\d{2})/g
  ]

  for (const pattern of phonePatterns) {
    const match = pattern.exec(transcript)
    if (match) {
      if (match[0].includes('+375')) {
        return match[0].replace(/\s+/g, ' ').trim()
      } else if (match[0].includes('8')) {
        const cleaned = match[0].replace(/[^\d]/g, '')
        if (cleaned.length >= 10) {
          return `+375 ${cleaned.substring(2, 4)} ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9)}`
        }
      } else {
        return `+375 29 ${match[1]}-${match[2]}-${match[3]}`
      }
    }
  }
  return undefined
}

function extractEmail(transcript: string): string | undefined {
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
  const match = emailPattern.exec(transcript)
  return match ? match[1] : undefined
}

function analyzeSentiment(transcript: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['хорошо', 'отлично', 'супер', 'замечательно', 'нравится', 'интересно', 'хочу', 'нужно']
  const negativeWords = ['плохо', 'не нравится', 'дорого', 'не подходит', 'проблема', 'не устраивает']
  
  const words = transcript.toLowerCase().split(/\s+/)
  const positiveCount = positiveWords.filter(word => words.some(w => w.includes(word))).length
  const negativeCount = negativeWords.filter(word => words.some(w => w.includes(word))).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

function extractIntent(transcript: string): string[] {
  const intents: string[] = []
  const text = transcript.toLowerCase()
  
  if (text.includes('купить') || text.includes('заказать') || text.includes('приобрести')) {
    intents.push('purchase')
  }
  if (text.includes('цена') || text.includes('стоимость') || text.includes('сколько')) {
    intents.push('pricing')
  }
  if (text.includes('информация') || text.includes('расскажите') || text.includes('узнать')) {
    intents.push('information')
  }
  if (text.includes('консультация') || text.includes('совет') || text.includes('помощь')) {
    intents.push('consultation')
  }
  
  return intents
}

function analyzeUrgency(transcript: string): 'low' | 'medium' | 'high' {
  const urgentWords = ['срочно', 'быстро', 'немедленно', 'сегодня', 'завтра']
  const mediumWords = ['скоро', 'в ближайшее время', 'на неделе']
  
  const text = transcript.toLowerCase()
  
  if (urgentWords.some(word => text.includes(word))) return 'high'
  if (mediumWords.some(word => text.includes(word))) return 'medium'
  return 'low'
}

function checkBudgetMention(transcript: string): boolean {
  const budgetWords = ['бюджет', 'деньги', 'рубл', 'доллар', 'евро', 'стоимость', 'цена']
  return budgetWords.some(word => transcript.toLowerCase().includes(word))
}

function checkTimelineMention(transcript: string): boolean {
  const timeWords = ['когда', 'сроки', 'время', 'дата', 'месяц', 'неделя', 'день']
  return timeWords.some(word => transcript.toLowerCase().includes(word))
}

function calculateEnhancedLeadScore(
  data: EnhancedLeadData, 
  transcript: string, 
  conversationData?: any
): number {
  let score = 50 // Base score

  // Contact information scores
  if (data.email) score += 25
  if (data.phone) score += 20
  if (data.name) score += 15

  // Intent and engagement scores
  if (data.intent?.includes('purchase')) score += 15
  if (data.intent?.includes('pricing')) score += 10
  if (data.intent?.includes('consultation')) score += 8

  // Urgency scores
  if (data.urgency === 'high') score += 15
  else if (data.urgency === 'medium') score += 8

  // Sentiment scores
  if (data.sentiment === 'positive') score += 10
  else if (data.sentiment === 'negative') score -= 5

  // Context scores
  if (data.budget_mentioned) score += 12
  if (data.timeline_mentioned) score += 8

  // Conversation quality scores
  if (conversationData) {
    // Longer conversations are usually better quality
    if (conversationData.duration > 120) score += 10
    else if (conversationData.duration > 60) score += 5
    
    // Good sentiment from ElevenLabs
    if (conversationData.sentiment_score > 0.7) score += 15
    else if (conversationData.sentiment_score > 0.5) score += 8
  }

  return Math.min(Math.max(score, 0), 100) // Clamp between 0-100
}

function generateConversationSummary(transcript: string, data: EnhancedLeadData): string {
  const parts: string[] = []
  
  if (data.name) parts.push(`Клиент: ${data.name}`)
  if (data.intent && data.intent.length > 0) {
    parts.push(`Цель: ${data.intent.join(', ')}`)
  }
  if (data.sentiment) parts.push(`Настроение: ${data.sentiment}`)
  if (data.urgency !== 'low') parts.push(`Срочность: ${data.urgency}`)
  
  const summary = parts.join(' | ')
  const transcriptPreview = transcript.length > 200 
    ? transcript.substring(0, 200) + '...' 
    : transcript
    
  return summary ? `${summary}\n\nОтрывок: ${transcriptPreview}` : transcriptPreview
} 
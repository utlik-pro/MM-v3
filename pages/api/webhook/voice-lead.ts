import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript, conversationId, agentId, metadata } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    // Extract contact information from transcript
    const contactInfo = extractContactInfo(transcript);
    
    if (!contactInfo.name && !contactInfo.phone && !contactInfo.email) {
      return res.status(200).json({ 
        message: 'No contact information found in transcript',
        processed: false
      });
    }

    // Calculate lead score
    const score = calculateLeadScore(contactInfo, transcript);

    // Create lead in database
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        contact_info: JSON.stringify(contactInfo),
        source: 'voice_widget',
        status: 'NEW',
        score,
        notes: transcript,
        agent_id: agentId || 'agent_2001k4cgbmjhebd92cbzn8fk2zmk',
        client_id: 'default-client',
        conversation_id: conversationId || null,
        metadata: metadata ? JSON.stringify(metadata) : null
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Transform for response
    const transformedLead = {
      ...newLead,
      contactInfo: newLead.contact_info ? JSON.parse(newLead.contact_info) : {},
      createdAt: newLead.created_at,
      updatedAt: newLead.updated_at
    };

    console.log('✅ New lead captured from voice:', transformedLead);

    return res.status(200).json({
      success: true,
      lead: transformedLead,
      extracted: contactInfo,
      score
    });

  } catch (error) {
    console.error('❌ Error processing voice lead:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function extractContactInfo(transcript: string): any {
  const contactInfo: any = {};
  const text = transcript.toLowerCase();

  // Extract phone numbers (Belarus format)
  const phonePatterns = [
    /\+375\s*\(?(\d{2})\)?\s*(\d{3})[- ]?(\d{2})[- ]?(\d{2})/g,
    /8\s*\(?0(\d{2})\)?\s*(\d{3})[- ]?(\d{2})[- ]?(\d{2})/g,
    /(\d{3})[- ]?(\d{2})[- ]?(\d{2})/g
  ];

  for (const pattern of phonePatterns) {
    const match = pattern.exec(transcript);
    if (match) {
      if (match[0].includes('+375')) {
        contactInfo.phone = match[0].replace(/\s+/g, ' ').trim();
      } else if (match[0].includes('8')) {
        // Convert 8-0XX format to +375
        const cleaned = match[0].replace(/[^\d]/g, '');
        if (cleaned.length >= 10) {
          contactInfo.phone = `+375 ${cleaned.substring(2, 4)} ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9)}`;
        }
      } else {
        // Assume it's a local number and add +375 29
        contactInfo.phone = `+375 29 ${match[1]}-${match[2]}-${match[3]}`;
      }
      break;
    }
  }

  // Extract email addresses
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const emailMatch = emailPattern.exec(transcript);
  if (emailMatch) {
    contactInfo.email = emailMatch[1];
  }

  // Extract names (Russian/Belarusian)
  const namePatterns = [
    /меня зовут\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
    /я\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
    /имя\s+([а-яё]+(?:\s+[а-яё]+)?)/i,
    /меня звать\s+([а-яё]+(?:\s+[а-яё]+)?)/i
  ];

  for (const pattern of namePatterns) {
    const match = pattern.exec(transcript);
    if (match) {
      const name = match[1].trim();
      // Capitalize first letter of each word
      contactInfo.name = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      break;
    }
  }

  return contactInfo;
}

function calculateLeadScore(contactInfo: any, transcript: string): number {
  let score = 50; // Base score

  // Increase score if we have email
  if (contactInfo.email) {
    score += 20;
  }

  // Increase score if we have complete phone number
  if (contactInfo.phone && contactInfo.phone.length >= 10) {
    score += 15;
  }

  // Increase score if we have name
  if (contactInfo.name) {
    score += 10;
  }

  // Increase score based on transcript content
  if (transcript) {
    const positiveKeywords = ['заинтересован', 'хочу', 'нужно', 'срочно', 'когда', 'цена', 'купить', 'заказать'];
    const transcriptWords = transcript.toLowerCase().split(' ');
    const positiveMatches = positiveKeywords.filter(keyword => 
      transcriptWords.some(word => word.includes(keyword))
    );
    score += positiveMatches.length * 5;
  }

  return Math.min(score, 100); // Cap at 100
} 
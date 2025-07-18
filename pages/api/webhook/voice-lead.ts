import type { NextApiRequest, NextApiResponse } from 'next';

// Rate limiting для защиты от спама
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 минута
const RATE_LIMIT_MAX_REQUESTS = 10;

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
    // Rate limiting по IP
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const userRequests = rateLimit.get(clientIP) || [];
    
    // Очистка старых запросов
    const recentRequests = userRequests.filter((time: number) => now - time < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    recentRequests.push(now);
    rateLimit.set(clientIP, recentRequests);

    // Логирование входящих данных
    console.log('Voice lead webhook received:', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Парсинг данных от голосового ассистента
    const {
      conversation_id,
      agent_id,
      user_data,
      transcript,
      metadata
    } = req.body;

    // Валидация обязательных полей
    if (!conversation_id || !agent_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: conversation_id, agent_id' 
      });
    }

    // Извлечение контактной информации из user_data или transcript
    const leadData = extractLeadFromData(user_data, transcript, metadata);
    
    if (!leadData.contactInfo.name && !leadData.contactInfo.phone) {
      return res.status(400).json({ 
        error: 'No valid contact information found' 
      });
    }

    // Создание лида через API
    const lead = await createLead({
      agentId: agent_id,
      conversationId: conversation_id,
      contactInfo: leadData.contactInfo,
      source: 'voice_widget',
      notes: leadData.notes,
      metadata: {
        transcript: transcript,
        capturedAt: new Date().toISOString(),
        userAgent: req.headers['user-agent'],
        ip: clientIP,
        ...metadata
      }
    });

    // Отправка уведомлений (в реальной системе)
    await sendLeadNotifications(lead);

    console.log('Lead created successfully:', lead.id);

    return res.status(200).json({
      success: true,
      leadId: lead.id,
      message: 'Lead captured successfully'
    });

  } catch (error) {
    console.error('Error processing voice lead webhook:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process lead'
    });
  }
}

function extractLeadFromData(userData: any, transcript: any, metadata: any) {
  const contactInfo: any = {};
  let notes = '';

  // Попытка извлечь данные из userData (если ElevenLabs передает структурированные данные)
  if (userData) {
    contactInfo.name = userData.name || userData.full_name || userData.firstName;
    contactInfo.phone = userData.phone || userData.phone_number || userData.mobile;
    contactInfo.email = userData.email || userData.email_address;
    notes = userData.notes || userData.message || '';
  }

  // Если структурированных данных нет, пытаемся извлечь из транскрипта
  if (transcript && (!contactInfo.name || !contactInfo.phone)) {
    const transcriptText = typeof transcript === 'string' ? transcript : 
                         transcript.text || JSON.stringify(transcript);
    
    const extractedData = extractContactFromTranscript(transcriptText);
    
    contactInfo.name = contactInfo.name || extractedData.name;
    contactInfo.phone = contactInfo.phone || extractedData.phone;
    contactInfo.email = contactInfo.email || extractedData.email;
    notes = notes || extractedData.notes || transcriptText.substring(0, 500);
  }

  return { contactInfo, notes };
}

function extractContactFromTranscript(text: string) {
  const result: any = {};
  
  // Регулярные выражения для извлечения данных
  const phoneRegex = /(?:\+375|8)?[\s\-\(\)]?(?:25|29|33|44)[\s\-\(\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  
  // Поиск имен после ключевых фраз
  const namePatterns = [
    /меня зовут\s+([А-Яа-я]+(?:\s+[А-Яа-я]+)?)/i,
    /я\s+([А-Яа-я]+(?:\s+[А-Яа-я]+)?)/i,
    /мое имя\s+([А-Яа-я]+(?:\s+[А-Яа-я]+)?)/i
  ];

  // Извлечение телефона
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    result.phone = phoneMatch[0].replace(/[\s\-\(\)]/g, '');
    // Нормализация белорусского номера
    if (result.phone.startsWith('8')) {
      result.phone = '+375' + result.phone.substring(1);
    } else if (!result.phone.startsWith('+375')) {
      result.phone = '+375' + result.phone;
    }
  }

  // Извлечение email
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    result.email = emailMatch[0];
  }

  // Извлечение имени
  for (const pattern of namePatterns) {
    const nameMatch = text.match(pattern);
    if (nameMatch) {
      result.name = nameMatch[1].trim();
      break;
    }
  }

  // Если имя не найдено, попробуем найти слова, которые могут быть именами
  if (!result.name) {
    const words = text.split(/\s+/);
    const possibleNames = words.filter(word => 
      /^[А-Я][а-я]{2,}$/.test(word) && 
      !['Привет', 'Здравствуйте', 'Спасибо', 'Пожалуйста'].includes(word)
    );
    if (possibleNames.length > 0) {
      result.name = possibleNames.slice(0, 2).join(' ');
    }
  }

  result.notes = text;
  
  return result;
}

async function createLead(leadData: any) {
  // В реальной системе здесь будет сохранение в базу данных
  // Пока используем API endpoint для создания лида
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create lead: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating lead:', error);
    // Fallback: сохранение в файл или другой метод
    const lead = {
      id: `lead_${Date.now()}`,
      ...leadData,
      createdAt: new Date().toISOString()
    };
    
    console.log('Fallback lead created:', lead);
    return lead;
  }
}

async function sendLeadNotifications(lead: any) {
  // В реальной системе здесь будет отправка уведомлений
  try {
    // Email уведомление
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      console.log('Sending email notification for lead:', lead.id);
      // Здесь будет интеграция с email сервисом
    }

    // Webhook уведомления для CRM систем
    if (process.env.CRM_WEBHOOK_URL) {
      console.log('Sending webhook notification for lead:', lead.id);
      // Здесь будет отправка в CRM
    }

    // Telegram/Slack уведомления
    if (process.env.TELEGRAM_BOT_TOKEN) {
      console.log('Sending Telegram notification for lead:', lead.id);
      // Здесь будет отправка в Telegram
    }

  } catch (error) {
    console.error('Error sending notifications:', error);
  }
} 
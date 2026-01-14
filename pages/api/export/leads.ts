import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Получаем параметры экспорта
    const { format = 'csv', days = '30' } = req.query;
    
    // Рассчитываем дату начала периода
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    // Получаем данные лидов
    const { data: leads, error } = await supabase
      .from('Lead')
      .select(`
        id,
        contactInfo,
        qualityScore,
        source,
        notes,
        createdAt,
        updatedAt,
        metadata
      `)
      .gte('createdAt', startDate.toISOString())
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Ошибка получения лидов:', error);
      return res.status(500).json({ error: 'Ошибка получения данных' });
    }

    if (format === 'csv') {
      // Формируем CSV
      const csvHeaders = [
        'ID',
        'Имя',
        'Телефон', 
        'Email',
        'Качество (%)',
        'Источник',
        'Заметки',
        'Создан',
        'Обновлен',
        'Conversation ID'
      ];

      const csvRows = leads.map(lead => {
        const contactInfo = lead.contactInfo || {};
        const metadata = lead.metadata || {};
        
        return [
          lead.id,
          contactInfo.name || '',
          contactInfo.phone || '',
          contactInfo.email || '',
          lead.qualityScore || '',
          lead.source || '',
          lead.notes || '',
          new Date(lead.createdAt).toLocaleString('ru-RU'),
          new Date(lead.updatedAt).toLocaleString('ru-RU'),
          metadata.eleven_labs_conversation_id || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`);
      });

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      // Устанавливаем заголовки для скачивания файла
      const filename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Добавляем BOM для корректного отображения кириллицы в Excel
      const bom = '\uFEFF';
      return res.send(bom + csvContent);
    }

    if (format === 'json') {
      // JSON экспорт
      const filename = `leads_export_${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      return res.json({
        exported_at: new Date().toISOString(),
        period_days: parseInt(days as string),
        total_leads: leads.length,
        leads: leads
      });
    }

    // По умолчанию возвращаем JSON
    return res.json({
      message: 'Экспорт завершен',
      total_leads: leads.length,
      period_days: parseInt(days as string)
    });

  } catch (error) {
    console.error('Ошибка экспорта лидов:', error);
    return res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
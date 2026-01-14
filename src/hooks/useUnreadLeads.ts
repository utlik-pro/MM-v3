import { useState, useEffect, useCallback } from 'react';

interface UnreadLeadsHook {
  unreadCount: number;
  markAllAsRead: () => void;
  markLeadAsRead: (leadId: string) => void;
  refresh: () => void;
}

export function useUnreadLeads(): UnreadLeadsHook {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastChecked, setLastChecked] = useState<number>(Date.now());

  // Ключ для localStorage
  const STORAGE_KEY = 'minsk_mir_last_lead_check';
  const READ_LEADS_KEY = 'minsk_mir_read_leads';

  // Получаем последнее время проверки из localStorage
  const getLastChecked = useCallback(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? parseInt(stored) : Date.now();
    }
    return Date.now();
  }, []);

  // Получаем список прочитанных лидов
  const getReadLeads = useCallback((): Set<string> => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(READ_LEADS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  }, []);

  // Сохраняем список прочитанных лидов
  const saveReadLeads = useCallback((readLeads: Set<string>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(READ_LEADS_KEY, JSON.stringify(Array.from(readLeads)));
    }
  }, []);

  // Функция для подсчета непрочитанных лидов
  const countUnreadLeads = useCallback(async () => {
    try {
      const lastCheck = getLastChecked();
      const readLeads = getReadLeads();

      console.log('🔍 Checking unread leads since:', new Date(lastCheck).toISOString());

      const response = await fetch(`/api/leads/new-leads?since=${lastCheck}`);
      if (!response.ok) {
        console.error('❌ Failed to fetch new leads');
        return;
      }

      const data = await response.json();
      const allNewLeads = data.newLeads || [];

      // Фильтруем непрочитанные лиды
      const unreadLeads = allNewLeads.filter((lead: any) => !readLeads.has(lead.id));
      
      console.log('📊 Unread leads count:', unreadLeads.length);
      setUnreadCount(unreadLeads.length);

    } catch (error) {
      console.error('❌ Error counting unread leads:', error);
    }
  }, [getLastChecked, getReadLeads]);

  // Отмечаем все лиды как прочитанные
  const markAllAsRead = useCallback(() => {
    const now = Date.now();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, now.toString());
    }
    setLastChecked(now);
    setUnreadCount(0);
    console.log('✅ Marked all leads as read');
  }, []);

  // Отмечаем конкретный лид как прочитанный
  const markLeadAsRead = useCallback((leadId: string) => {
    const readLeads = getReadLeads();
    readLeads.add(leadId);
    saveReadLeads(readLeads);
    
    // Пересчитываем непрочитанные
    countUnreadLeads();
    console.log('✅ Marked lead as read:', leadId);
  }, [getReadLeads, saveReadLeads, countUnreadLeads]);

  // Принудительное обновление
  const refresh = useCallback(() => {
    countUnreadLeads();
  }, [countUnreadLeads]);

  // Инициализация и периодическая проверка
  useEffect(() => {
    // Инициализация
    const storedLastChecked = getLastChecked();
    setLastChecked(storedLastChecked);
    
    // Первоначальный подсчет
    countUnreadLeads();

    // Проверяем каждые 30 секунд
    const interval = setInterval(countUnreadLeads, 30000);

    return () => clearInterval(interval);
  }, [getLastChecked, countUnreadLeads]);

  return {
    unreadCount,
    markAllAsRead,
    markLeadAsRead,
    refresh
  };
} 
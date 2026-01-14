import { useState, useEffect, useCallback, useRef } from 'react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  comment: string;
  createdAt: string;
}

interface UseNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  isEnabled: boolean;
  requestPermission: () => Promise<void>;
  enableNotifications: () => void;
  disableNotifications: () => void;
  newLeadsCount: number;
}

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(Date.now());

  // Check if notifications are supported
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }, [isSupported]);

  // Initialize permission state
  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  // Function to show notification
  const showNotification = useCallback((lead: Lead) => {
    if (!isSupported || permission !== 'granted') return;

    const notification = new Notification('Новый лид!', {
      body: `${lead.name} (${lead.phone})\n${lead.comment}`,
      icon: '/favicon.ico',
      tag: `lead-${lead.id}`,
      requireInteraction: false,
      silent: false
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Click handler to focus window
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }, [isSupported, permission]);

  // Function to check for new leads
  const checkForNewLeads = useCallback(async () => {
    try {
      const response = await fetch(`/api/leads/new-leads?since=${lastCheckRef.current}`);
      if (!response.ok) return;

      const data = await response.json();
      
      if (data.newLeads && data.newLeads.length > 0) {
        setNewLeadsCount(prev => prev + data.newLeads.length);
        
        // Show notification for each new lead
        data.newLeads.forEach((lead: Lead) => {
          showNotification(lead);
        });
        
        // Play notification sound using Web Audio API
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
          // Ignore audio errors
        }
      }
      
      lastCheckRef.current = Date.now();
    } catch (error) {
      console.error('Error checking for new leads:', error);
    }
  }, [showNotification]);

  // Enable notifications
  const enableNotifications = useCallback(() => {
    if (!isSupported || permission !== 'granted') return;
    
    setIsEnabled(true);
    setNewLeadsCount(0);
    lastCheckRef.current = Date.now();
    
    // Check every 30 seconds
    intervalRef.current = setInterval(checkForNewLeads, 30000);
  }, [isSupported, permission, checkForNewLeads]);

  // Disable notifications
  const disableNotifications = useCallback(() => {
    setIsEnabled(false);
    setNewLeadsCount(0);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-enable if permission is granted and stored preference
  useEffect(() => {
    if (isSupported && permission === 'granted') {
      const storedPreference = localStorage.getItem('notifications-enabled');
      if (storedPreference === 'true') {
        enableNotifications();
      }
    }
  }, [isSupported, permission, enableNotifications]);

  // Store preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications-enabled', isEnabled.toString());
    }
  }, [isEnabled]);

  return {
    permission,
    isSupported,
    isEnabled,
    requestPermission,
    enableNotifications,
    disableNotifications,
    newLeadsCount
  };
} 
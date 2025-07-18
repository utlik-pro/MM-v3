'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Loader2, AlertCircle } from 'lucide-react';

type CallStatus = 'idle' | 'connecting' | 'connected' | 'error';

export function CallButton() {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const conversationRef = useRef<any>(null);

  // Initialize Voice Assistant conversation
  const initializeConversation = useCallback(async () => {
    try {
      setStatus('connecting');
      setError(null);

      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from our proxy API
      const response = await fetch('/api/elevenlabs/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }

      const data = await response.json();
      setSignedUrl(data.signed_url);

      // Dynamically import Voice Assistant client to avoid SSR issues
      const { Conversation } = await import('@elevenlabs/client');
      
      // Use the correct startSession method
      const conversation = await Conversation.startSession({
        signedUrl: data.signed_url,
        onConnect: () => {
          console.log('Connected to Voice Assistant');
          setStatus('connected');
        },
        onDisconnect: () => {
          console.log('Disconnected from Voice Assistant');
          setStatus('idle');
          setSignedUrl(null);
        },
        onError: (message: string) => {
          console.error('Voice Assistant error:', message);
          setError(message);
          setStatus('error');
        },
        onMessage: (props: { message: string; source: any }) => {
          console.log('Message:', props.message, 'Source:', props.source);
        }
      });

      conversationRef.current = conversation;

    } catch (err) {
      console.error('Failed to initialize conversation:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      setStatus('error');
    }
  }, []);

  // End conversation
  const endConversation = useCallback(async () => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
        conversationRef.current = null;
        setStatus('idle');
        setSignedUrl(null);
      } catch (err) {
        console.error('Failed to end conversation:', err);
        setStatus('idle');
      }
    }
  }, []);

  // Handle click
  const handleClick = useCallback(() => {
    if (status === 'idle') {
      initializeConversation();
    } else if (status === 'connected') {
      endConversation();
    }
  }, [status, initializeConversation, endConversation]);

  // Get button content based on status
  const getButtonContent = () => {
    switch (status) {
      case 'idle':
        return (
          <>
            <Phone className="w-5 h-5 mr-3" />
            <span className="font-medium">Позвонить</span>
          </>
        );
      case 'connecting':
        return (
          <>
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            <span className="font-medium">Соединение...</span>
          </>
        );
      case 'connected':
        return (
          <>
            <PhoneOff className="w-5 h-5 mr-3" />
            <span className="font-medium">Завершить</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-5 h-5 mr-3" />
            <span className="font-medium">Ошибка</span>
          </>
        );
      default:
        return (
          <>
            <Phone className="w-5 h-5 mr-3" />
            <span className="font-medium">Позвонить</span>
          </>
        );
    }
  };

  // Get button classes based on status
  const getButtonClasses = () => {
    const baseClasses = "inline-flex items-center justify-center px-8 py-4 rounded-full text-white font-medium text-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 shadow-lg focus:outline-none focus:ring-4 focus:ring-offset-2 min-w-[200px]";
    
    switch (status) {
      case 'idle':
        return `${baseClasses} bg-black hover:bg-gray-800 focus:ring-gray-300 shadow-black/25`;
      case 'connecting':
        return `${baseClasses} bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 cursor-wait`;
      case 'connected':
        return `${baseClasses} bg-red-600 hover:bg-red-700 focus:ring-red-300 animate-pulse`;
      case 'error':
        return `${baseClasses} bg-red-500 hover:bg-red-600 focus:ring-red-300`;
      default:
        return `${baseClasses} bg-black hover:bg-gray-800 focus:ring-gray-300`;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={handleClick}
        disabled={status === 'connecting'}
        className={getButtonClasses()}
        aria-label={status === 'connected' ? 'Завершить звонок' : 'Начать звонок'}
      >
        {getButtonContent()}
      </button>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Скрыть
          </button>
        </div>
      )}
      

    </div>
  );
} 
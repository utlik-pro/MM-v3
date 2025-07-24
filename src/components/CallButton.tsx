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
            <Phone className="w-4 h-4 mr-2 animate-phone-shake text-white" />
            <span className="font-medium text-white">Позвонить</span>
          </>
        );
      case 'connecting':
        return (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
            <span className="font-medium text-white">Соединение...</span>
          </>
        );
      case 'connected':
        return (
          <>
            <PhoneOff className="w-4 h-4 mr-2 text-white" />
            <span className="font-medium text-white">Завершить</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-4 h-4 mr-2 text-white" />
            <span className="font-medium text-white">Ошибка</span>
          </>
        );
      default:
        return (
          <>
            <Phone className="w-4 h-4 mr-2 animate-phone-shake text-white" />
            <span className="font-medium text-white">Позвонить</span>
          </>
        );
    }
  };

  // Get button classes based on status
  const getButtonClasses = () => {
    const baseClasses = "inline-flex items-center justify-center px-4 py-2 rounded-full text-white font-medium text-sm transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 shadow-lg outline-none min-w-[130px] relative";
    
    switch (status) {
      case 'idle':
        return `${baseClasses} bg-gray-800 hover:bg-gray-700 shadow-gray-800/25`;
      case 'connecting':
        return `${baseClasses} bg-blue-600 hover:bg-blue-700 cursor-wait`;
      case 'connected':
        return `${baseClasses} bg-red-600 hover:bg-red-700 animate-pulse`;
      case 'error':
        return `${baseClasses} bg-red-500 hover:bg-red-600`;
      default:
        return `${baseClasses} bg-gray-800 hover:bg-gray-700`;
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
    <>
      {/* Fixed tooltip - only when idle */}
      {status === 'idle' && (
        <div className="fixed bottom-24 right-6 z-[999999] pointer-events-none">
          <div className="bg-gray-900 text-white text-sm rounded-lg py-2 px-3 shadow-lg animate-bounce-gentle max-w-xs text-center">
            Нужна персональная подборка квартир?<br />
            Кликните - позвонить и получите консультацию за 30 секунд!
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}

      {/* Button with wave lines wrapper */}
      <div className="relative">
        {/* Wave lines - only when idle */}
        {status === 'idle' && (
          <>
            {/* Right side lines */}
            <div className="absolute top-1/2 left-full ml-2 transform -translate-y-1/2">
              <div className="w-6 h-0.5 bg-white/40 animate-wave-line-1"></div>
              <div className="w-8 h-0.5 bg-white/30 animate-wave-line-2 mt-1"></div>
              <div className="w-10 h-0.5 bg-white/20 animate-wave-line-3 mt-1"></div>
            </div>
            
            {/* Left side lines */}
            <div className="absolute top-1/2 right-full mr-2 transform -translate-y-1/2 flex flex-col items-end">
              <div className="w-6 h-0.5 bg-white/40 animate-wave-line-1"></div>
              <div className="w-8 h-0.5 bg-white/30 animate-wave-line-2 mt-1"></div>
              <div className="w-10 h-0.5 bg-white/20 animate-wave-line-3 mt-1"></div>
            </div>
          </>
        )}
        
        {/* Button */}
        <button
          onClick={handleClick}
          disabled={status === 'connecting'}
          className={getButtonClasses()}
          aria-label={status === 'connected' ? 'Завершить звонок' : 'Начать звонок'}
        >
          {getButtonContent()}
        </button>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm z-[999999]">
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
    </>
  );
} 
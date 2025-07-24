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
    <div className="fixed bottom-4 right-4 z-[999999]">
      {/* AI Assistant tooltip - positioned above the button */}
      {status === 'idle' && (
        <div className="absolute bottom-full right-0 mb-4 pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl p-4 max-w-xs animate-bounce-gentle border border-gray-100 min-w-[280px] relative">
            {/* Profile Section - COMMENTED OUT */}
            {/* 
            <div className="flex flex-col items-center text-center mb-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mb-3 shadow-lg">
                <span className="text-white font-bold text-xl">А</span>
              </div>
              <h3 className="text-gray-900 font-semibold text-lg leading-tight">Анна</h3>
              <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">Специалист по продажам</p>
            </div>
            */}
            
            {/* AI Assistant Message */}
            <div className="text-center mb-4 relative">
              <p className="text-gray-700 text-sm leading-relaxed">
                <span className="inline-block mr-1">🤖</span>
                AI-помощник подберёт лучшие варианты новостроек под ваши запросы.<br />
                Нажмите для консультации
                <span className="inline-block ml-1">
                  <svg 
                    className="w-3 h-3 text-blue-500 animate-pulse inline-block" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                    />
                  </svg>
                </span>
              </p>
            </div>
            
            {/* Arrow pointing down to button */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-[-1px]">
              <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white"></div>
            </div>
          </div>
        </div>
      )}

      {/* Button container with wave lines */}
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
        <div className="absolute bottom-full right-0 mb-4 bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm">
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
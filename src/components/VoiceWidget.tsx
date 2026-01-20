'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Loader2, AlertCircle } from 'lucide-react';
import type { WidgetConfig, ConversationConfig } from '@/types/elevenlabs';

interface VoiceWidgetProps {
  config?: Partial<WidgetConfig>;
  className?: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
type ConversationMode = 'listening' | 'speaking';

export function VoiceWidget({ config = {}, className = '' }: VoiceWidgetProps) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [mode, setMode] = useState<ConversationMode>('listening');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [privacyPolicyChecked, setPrivacyPolicyChecked] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  const conversationRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Default configuration
  const widgetConfig: WidgetConfig = {
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_8901k4s5hkbkf7gsf1tk5r0a4g8t',
    variant: 'full',
    avatarOrbColor1: '#2563eb',
    avatarOrbColor2: '#0ea5e9',
    actionText: 'Нужна помощь?',
    startCallText: 'Начать разговор',
    endCallText: 'Завершить разговор',
    listeningText: 'Слушаю...',
    speakingText: 'Говорю...',
    dynamicVariables: {
      company: 'MinskMir',
      language: 'ru',
      source: 'unknown'
    },
    ...config
  };


  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (err) {
      setHasPermission(false);
      setError('Требуется доступ к микрофону для голосового общения');
    }
  };

  const getSignedUrl = async (): Promise<string> => {
    const response = await fetch('/api/elevenlabs/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get signed URL');
    }

    const data = await response.json();
    return data.signed_url;
  };

  const handleCheckboxChange = (checkbox: 'privacy' | 'consent') => {
    if (checkbox === 'privacy') {
      setPrivacyPolicyChecked(!privacyPolicyChecked);
    } else {
      setConsentChecked(!consentChecked);
    }
    // Hide validation error when user changes checkboxes
    if (showValidationError) {
      setShowValidationError(false);
    }
  };

  const startConversation = useCallback(async () => {
    // Validate checkboxes
    if (!privacyPolicyChecked || !consentChecked) {
      setShowValidationError(true);
      setTimeout(() => setShowValidationError(false), 3000);
      return;
    }

    try {
      setError(null);
      setShowValidationError(false);
      setStatus('connecting');

      // Request microphone permission
      if (!hasPermission) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
      }

      // Get signed URL for secure connection
      const signedUrl = await getSignedUrl();

      // Dynamic import of ElevenLabs client to avoid SSR issues
      const { Conversation } = await import('@elevenlabs/client');

      // Start conversation
      const conversation = await Conversation.startSession({
        signedUrl,
        dynamicVariables: widgetConfig.dynamicVariables,
        onConnect: () => {
          setStatus('connected');
          setMode('listening');
        },
        onDisconnect: () => {
          setStatus('disconnected');
          setMode('listening');
          conversationRef.current = null;
        },
        onError: (message: string) => {
          console.error('Conversation error:', message);
          setError(message);
          setStatus('disconnected');
        },
        onModeChange: (modeData: { mode: 'speaking' | 'listening' }) => {
          setMode(modeData.mode);
        },
      });

      conversationRef.current = conversation;

    } catch (error) {
      console.error('Failed to start conversation:', error);
      setError(error instanceof Error ? error.message : 'Не удалось начать разговор');
      setStatus('disconnected');
    }
  }, [hasPermission, widgetConfig.dynamicVariables, privacyPolicyChecked, consentChecked]);

  const stopConversation = useCallback(async () => {
    try {
      if (conversationRef.current) {
        await conversationRef.current.endSession();
        conversationRef.current = null;
      }
      setStatus('disconnected');
      setMode('listening');
    } catch (error) {
      console.error('Failed to stop conversation:', error);
      setError('Не удалось завершить разговор');
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    // Here you would implement actual mute functionality with the conversation
    if (conversationRef.current?.setMicrophoneMuted) {
      conversationRef.current.setMicrophoneMuted(!isMuted);
    }
  }, [isMuted]);

  const retryConnection = useCallback(() => {
    setError(null);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    retryTimeoutRef.current = setTimeout(() => {
      startConversation();
    }, 1000);
  }, [startConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const getStatusText = () => {
    if (error) return error;
    if (status === 'connecting') return 'Подключение...';
    if (status === 'connected') {
      return mode === 'speaking' ? widgetConfig.speakingText : widgetConfig.listeningText;
    }
    return 'Готов к разговору';
  };

  const getStatusColor = () => {
    if (error) return 'text-minskmir-error';
    if (status === 'connecting') return 'text-minskmir-warning';
    if (status === 'connected') {
      return mode === 'speaking' ? 'text-minskmir-success' : 'text-minskmir-accent';
    }
    return 'text-minskmir-secondary';
  };

  return (
    <div className={`voice-widget bg-white rounded-lg shadow-widget p-6 max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-minskmir-primary mb-2">
          MinskMir AI Консультант
        </h2>
        <p className="text-sm text-minskmir-secondary">
          Получите консультацию по недвижимости с помощью голосового ассистента
        </p>
      </div>

      {/* Avatar/Status Display */}
      <div className="flex flex-col items-center mb-6">
        <div 
          className={`
            w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-500
            ${status === 'connected' && mode === 'speaking' 
              ? 'animate-pulse-slow bg-gradient-to-br from-minskmir-success to-minskmir-accent' 
              : status === 'connected'
              ? 'animate-pulse bg-gradient-to-br from-minskmir-primary to-minskmir-accent'
              : 'bg-gradient-to-br from-minskmir-secondary to-minskmir-primary'
            }
          `}
          style={{
            background: status === 'connected' 
              ? `linear-gradient(135deg, ${widgetConfig.avatarOrbColor1}, ${widgetConfig.avatarOrbColor2})`
              : undefined
          }}
        >
          {status === 'connecting' ? (
            <Loader2 className="w-8 h-8 text-black animate-spin" />
          ) : status === 'connected' && mode === 'speaking' ? (
            <div className="w-8 h-8 bg-black rounded-full animate-recording" />
          ) : (
            <Mic className="w-8 h-8 text-black" />
          )}
        </div>

        <p className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 mb-2">{error}</p>
            {error.includes('микрофон') && (
              <button
                onClick={checkMicrophonePermission}
                className="text-xs text-red-600 underline hover:no-underline"
              >
                Попробовать снова
              </button>
            )}
          </div>
        </div>
      )}

      {/* Checkboxes for consent - only show when disconnected */}
      {status === 'disconnected' && (
        <div className="mb-4 space-y-2 px-2">
          {/* Privacy Policy Checkbox */}
          <label className="flex items-start space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyPolicyChecked}
              onChange={() => handleCheckboxChange('privacy')}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0 cursor-pointer"
            />
            <span className="text-xs text-gray-700 leading-tight">
              Я ознакомлен с <a href="https://bir.by/politike-v-otnoshenii-obrabotki-personalnyix-dannyix-potenczialnyix-klientov-v-ooo-bir-baj.html" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-700 underline">Политикой обработки персональных данных</a>
            </span>
          </label>

          {/* Consent Checkbox */}
          <label className="flex items-start space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={() => handleCheckboxChange('consent')}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0 cursor-pointer"
            />
            <span className="text-xs text-gray-700 leading-tight">
              Я ознакомлен с условиями и даю <a href="https://bir.by/aiconsent.pdf" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-700 underline">Согласие</a> на обработку моих персональных данных для получения консультации
            </span>
          </label>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-4">
        {status === 'disconnected' ? (
          <button
            onClick={startConversation}
            disabled={hasPermission === false}
            className="
              flex items-center gap-2 px-6 py-3 bg-minskmir-primary text-white rounded-lg font-medium
              hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 transition-all
              disabled:bg-gray-300 disabled:cursor-not-allowed
            "
          >
            <Phone className="w-5 h-5" />
            {widgetConfig.startCallText}
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`
                p-3 rounded-lg border-2 transition-all
                ${isMuted 
                  ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }
              `}
              title={isMuted ? 'Включить микрофон' : 'Выключить микрофон'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={stopConversation}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#EF403B',
                color: 'white',
                borderRadius: '8px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#d93832';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#EF403B';
              }}
            >
              <PhoneOff className="w-5 h-5" />
              {widgetConfig.endCallText}
            </button>
          </>
        )}
      </div>

      {/* Info text - only show when disconnected */}
      {status === 'disconnected' && (
        <p className="text-xs text-gray-500 text-center leading-tight mb-4">
          Без получения согласия консультация возможна только по телефону 7911
        </p>
      )}

      {/* Validation Error */}
      {showValidationError && (
        <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-700 text-xs text-center">
            Необходимо отметить оба чекбокса для продолжения
          </p>
        </div>
      )}

      {/* Permission Request */}
      {hasPermission === false && (
        <div className="text-center text-sm text-minskmir-secondary">
          <p className="mb-2">Для работы голосового ассистента необходим доступ к микрофону</p>
          <button
            onClick={checkMicrophonePermission}
            className="text-minskmir-primary underline hover:no-underline"
          >
            Предоставить доступ
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-minskmir-secondary mt-4 pt-4 border-t border-gray-100">
        <p>Разработано для MinskMir</p>
      </div>
    </div>
  );
} 
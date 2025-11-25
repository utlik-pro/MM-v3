'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Phone, X } from 'lucide-react';

interface CallButtonProps {
  onCallStart?: () => void;
  theme?: 'default' | 'blue' | 'purple' | 'orange' | 'red';
}

// Цветовые схемы для разных тем
const themeColors = {
  default: {
    icon: 'from-teal-600 to-green-700',
    iconBorder: 'border-teal-200',
    button: 'from-teal-600 to-green-700',
    buttonHover: 'from-teal-700 to-green-800',
    buttonConnected: '#EF403B',
    buttonConnectedHover: '#d93832'
  },
  blue: {
    icon: 'from-blue-600 to-indigo-700',
    iconBorder: 'border-blue-200',
    button: 'from-blue-600 to-indigo-700',
    buttonHover: 'from-blue-700 to-indigo-800',
    buttonConnected: '#EF403B',
    buttonConnectedHover: '#d93832'
  },
  purple: {
    icon: 'from-purple-800 to-purple-900',
    iconBorder: 'border-purple-300',
    button: 'from-purple-800 to-purple-900',
    buttonHover: 'from-purple-900 to-purple-950',
    buttonConnected: '#EF403B',
    buttonConnectedHover: '#d93832'
  },
  orange: {
    icon: 'from-orange-600 to-red-600',
    iconBorder: 'border-orange-200',
    button: 'from-orange-600 to-red-600',
    buttonHover: 'from-orange-700 to-red-700',
    buttonConnected: '#EF403B',
    buttonConnectedHover: '#d93832'
  },
  red: {
    icon: 'from-red-600 to-pink-700',
    iconBorder: 'border-red-200',
    button: 'from-red-600 to-pink-700',
    buttonHover: 'from-red-700 to-pink-800',
    buttonConnected: '#EF403B',
    buttonConnectedHover: '#d93832'
  }
};

const CallButton: React.FC<CallButtonProps> = ({ onCallStart, theme = 'default' }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [showWidget, setShowWidget] = useState(true);
  const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [privacyPolicyChecked, setPrivacyPolicyChecked] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const conversationRef = useRef<any>(null);

  // Получаем тему из URL параметров при загрузке компонента
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTheme = urlParams.get('theme') as keyof typeof themeColors;
      console.log('URL theme parameter:', urlTheme);
      if (urlTheme && themeColors[urlTheme]) {
        console.log('Setting theme to:', urlTheme);
        setCurrentTheme(urlTheme);
      } else {
        console.log('Using default theme:', theme);
      }
    }
  }, [theme]);

  const colors = themeColors[currentTheme];
  console.log('Current theme:', currentTheme, 'Colors:', colors);

  // Cleanup ElevenLabs session on component unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession();
        conversationRef.current = null;
      }
    };
  }, []);

  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      setHasMicrophoneAccess(true);
      return stream;
    } catch (error) {
      console.error('Failed to get microphone access:', error);
      setHasMicrophoneAccess(false);
      
      // Provide specific error handling
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Доступ к микрофону запрещен');
        } else if (error.name === 'NotFoundError') {
          throw new Error('Микрофон не найден');
        }
      }
      
      throw error;
    }
  };

  const startRecording = (stream: MediaStream) => {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('Recording stopped, audio size:', audioBlob.size);
      
      // Here you would send the audio to your API
      // await sendAudioToAPI(audioBlob);
    };

    mediaRecorder.start(1000); // Collect data every second
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCallClick = async () => {
    // Validate checkboxes
    if (!privacyPolicyChecked || !consentChecked) {
      setShowValidationError(true);
      setTimeout(() => setShowValidationError(false), 3000);
      return;
    }

    try {
      setStatus('connecting');
      setShowValidationError(false);
      onCallStart?.();
      
      // Request microphone access
      const stream = await requestMicrophoneAccess();
      
      // Start recording
      startRecording(stream);
      
      // Get signed URL for ElevenLabs WebSocket connection
      const response = await fetch('/api/elevenlabs/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get ElevenLabs signed URL');
      }

      const { signed_url } = await response.json();
      console.log('ElevenLabs signed URL obtained:', signed_url);
      
      // Dynamic import of ElevenLabs client
      const { Conversation } = await import('@elevenlabs/client');
      
      // Start real ElevenLabs conversation
      const conversation = await Conversation.startSession({
        signedUrl: signed_url,
        onConnect: () => {
          console.log('Connected to ElevenLabs');
          setStatus('connected');
        },
        onDisconnect: () => {
          console.log('Disconnected from ElevenLabs');
          setStatus('idle');
          stopRecording();
        },
        onError: (error) => {
          console.error('ElevenLabs error:', error);
          throw new Error(`ElevenLabs connection failed: ${error}`);
        },
        onModeChange: ({ mode }) => {
          console.log('ElevenLabs mode:', mode);
          // Handle speaking/listening modes if needed
        }
      });
      
      // Store conversation reference for cleanup
      conversationRef.current = conversation;
      
      console.log('ElevenLabs conversation started');
    } catch (error) {
      console.error('Call error:', error);
      setStatus('error');
      
      // Show specific error message based on error type
      if (error instanceof Error && error.name === 'NotAllowedError') {
        // Microphone permission denied
        console.log('Microphone permission denied');
      }
      
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  const handleEndCall = () => {
    // End ElevenLabs conversation session
    if (conversationRef.current) {
      conversationRef.current.endSession();
      conversationRef.current = null;
    }
    stopRecording();
    setStatus('idle');
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    setShowWidget(false);
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

  if (!showWidget) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-[999999]"
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 999999,
        padding: '40px',
        margin: '-40px'
      }}
    >
      {/* New Modern Widget Design */}
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80"
        style={{
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.08)',
          WebkitBoxShadow: '0 0 40px rgba(0, 0, 0, 0.08)',
          MozBoxShadow: '0 0 40px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-4">
          {/* Icon and Text */}
          <div className="flex items-start space-x-3 flex-1">
            {/* AI Icon */}
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors.icon} flex items-center justify-center border-2 ${colors.iconBorder}`}>
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  {/* Large sparkle */}
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  {/* Small sparkle top right */}
                  <path d="M18 3L19 6L22 7L19 8L18 11L17 8L14 7L17 6L18 3Z" />
                  {/* Small sparkle bottom right */}
                  <path d="M19 16L20 18L22 19L20 20L19 22L18 20L16 19L18 18L19 16Z" />
                </svg>
              </div>
            </div>
            
            {/* Text */}
            <div className="flex-1">
              <p className="text-gray-900 leading-tight font-medium" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '15px', letterSpacing: '0%', lineHeight: '1.2' }}>
                Наш AI-помощник<br />
                подберет лучшие<br />
                варианты новостроек<br />
                под ваши запросы
              </p>
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        </div>
        
        {/* Checkboxes for consent */}
        <div className="mb-3 space-y-2">
          {/* Privacy Policy Checkbox */}
          <label className="flex items-start space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyPolicyChecked}
              onChange={() => handleCheckboxChange('privacy')}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 flex-shrink-0 cursor-pointer"
            />
            <span className="text-xs text-gray-700 leading-tight">
              Я ознакомлен с <span className="font-medium">Политикой обработки персональных данных</span>
            </span>
          </label>

          {/* Consent Checkbox */}
          <label className="flex items-start space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={() => handleCheckboxChange('consent')}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 flex-shrink-0 cursor-pointer"
            />
            <span className="text-xs text-gray-700 leading-tight">
              Я ознакомлен с условиями и даю <span className="font-medium">Согласие</span> на обработку моих персональных данных для получения консультации
            </span>
          </label>
        </div>

        {/* Call Button */}
        <button
          onClick={status === 'connected' ? handleEndCall : handleCallClick}
          disabled={status === 'connecting'}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-sm
            flex items-center justify-center space-x-2 transition-all duration-200
            ${status === 'connecting'
              ? 'cursor-not-allowed'
              : status === 'connected'
              ? 'text-white active:scale-95'
              : `text-white bg-gradient-to-r ${colors.button} hover:${colors.buttonHover} active:scale-95`
            }
          `}
          style={
            status === 'connecting'
              ? {
                  backgroundColor: 'white',
                  color: 'black',
                  border: '1px solid black'
                }
              : status === 'connected'
              ? { backgroundColor: colors.buttonConnected }
              : undefined
          }
          onMouseEnter={status === 'connected' ? (e) => {
            e.currentTarget.style.backgroundColor = colors.buttonConnectedHover;
            e.currentTarget.style.color = 'white';
          } : undefined}
          onMouseLeave={status === 'connected' ? (e) => {
            e.currentTarget.style.backgroundColor = colors.buttonConnected;
            e.currentTarget.style.color = 'white';
          } : undefined}
          aria-label={status === 'connected' ? 'Завершить звонок' : 'Позвонить'}
        >
          {status === 'connecting' ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '12px', fontWeight: '500' }}>
                СОЕДИНЕНИЕ
                <span className="animate-pulse">...</span>
              </span>
            </>
          ) : status === 'connected' ? (
            <>
              <X className="w-4 h-4" />
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '12px', fontWeight: '500' }}>ЗАВЕРШИТЬ</span>
            </>
          ) : (
            <>
              <Phone className="w-4 h-4" />
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '12px', fontWeight: '500' }}>ПОЗВОНИТЬ</span>
            </>
          )}
        </button>

        {/* Info text */}
        <p className="mt-2 text-xs text-gray-500 text-center leading-tight">
          Без получения согласия консультация возможна только по телефону 7675
        </p>

        {/* Validation Error */}
        {showValidationError && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-xs text-center">
              Необходимо отметить оба чекбокса для продолжения
            </p>
          </div>
        )}

        {/* Error Message */}
        {status === 'error' && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-xs text-center">
              {!hasMicrophoneAccess
                ? 'Требуется доступ к микрофону для звонка. Разрешите доступ и попробуйте снова.'
                : 'Ошибка подключения. Попробуйте еще раз.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallButton; 
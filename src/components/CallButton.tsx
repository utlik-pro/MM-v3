'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Phone, X } from 'lucide-react';

interface CallButtonProps {
  onCallStart?: () => void;
}

const CallButton: React.FC<CallButtonProps> = ({ onCallStart }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [showWidget, setShowWidget] = useState(true);
  const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const conversationRef = useRef<any>(null);

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
    try {
      setStatus('connecting');
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

  if (!showWidget) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[999999]">
      {/* New Modern Widget Design */}
      <div 
        className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 h-40"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          WebkitBoxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          MozBoxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-4">
          {/* Icon and Text */}
          <div className="flex items-start space-x-3 flex-1">
            {/* AI Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-green-700 flex items-center justify-center border-2 border-teal-200">
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
              : 'text-white bg-gradient-to-r from-teal-600 to-green-700 hover:from-teal-700 hover:to-green-800 active:scale-95'
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
              ? { backgroundColor: '#EF403B' } 
              : undefined
          }
          onMouseEnter={status === 'connected' ? (e) => {
            e.currentTarget.style.backgroundColor = '#d93832';
            e.currentTarget.style.color = 'white';
          } : undefined}
          onMouseLeave={status === 'connected' ? (e) => {
            e.currentTarget.style.backgroundColor = '#EF403B';
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
        
        
        {/* Error Message */}
        {status === 'error' && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
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
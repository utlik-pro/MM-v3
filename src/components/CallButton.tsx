'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Phone, X, Mic, MicOff } from 'lucide-react';

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

  // Check microphone access on component mount
  useEffect(() => {
    checkMicrophoneAccess();
  }, []);

  const checkMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicrophoneAccess(true);
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
    } catch (error) {
      console.log('Microphone access not granted:', error);
      setHasMicrophoneAccess(false);
    }
  };

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
      
      // Start conversation with ElevenLabs
      const response = await fetch('/api/conversation-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Привет! Я хочу узнать о новостройках',
          voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      console.log('Call started:', data);
      
      setStatus('connected');
    } catch (error) {
      console.error('Call error:', error);
      setStatus('error');
      
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  const handleEndCall = () => {
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
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-sm animate-bounce-gentle">
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-4">
          {/* Icon and Text */}
          <div className="flex items-start space-x-3 flex-1">
            {/* AI Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-green-700 flex items-center justify-center border-2 border-teal-200">
                <div className="relative">
                  {/* Sparkles */}
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full opacity-80 animate-sparkle"></div>
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-white rounded-full opacity-60 animate-sparkle" style={{animationDelay: '0.5s'}}></div>
                  <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-white rounded-full opacity-40 animate-sparkle" style={{animationDelay: '1s'}}></div>
                  {/* Main sparkle */}
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* Text */}
            <div className="flex-1">
              <p className="text-gray-900 text-sm leading-relaxed font-medium">
                Наш AI-помощник подберёт<br />
                лучшие варианты новостроек<br />
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
        
        {/* Separator */}
        <div className="border-t border-gray-200 mb-4"></div>
        
        {/* Microphone Status */}
        {!hasMicrophoneAccess && status === 'idle' && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-xs text-center flex items-center justify-center">
              <MicOff className="w-3 h-3 mr-1" />
              Разрешите доступ к микрофону для звонка
            </p>
          </div>
        )}
        
        {/* Call Button */}
        <button
          onClick={status === 'connected' ? handleEndCall : handleCallClick}
          disabled={status === 'connecting'}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-white text-sm
            flex items-center justify-center space-x-2 transition-all duration-200
            ${status === 'connecting' 
              ? 'bg-gray-400 cursor-not-allowed' 
              : status === 'connected'
              ? 'bg-red-600 hover:bg-red-700 active:scale-95'
              : 'bg-gradient-to-r from-teal-600 to-green-700 hover:from-teal-700 hover:to-green-800 active:scale-95'
            }
          `}
          aria-label={status === 'connected' ? 'Завершить звонок' : 'Позвонить'}
        >
          {status === 'connecting' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>СОЕДИНЕНИЕ</span>
            </>
          ) : status === 'connected' ? (
            <>
              <X className="w-4 h-4" />
              <span>ЗАВЕРШИТЬ</span>
            </>
          ) : (
            <>
              {hasMicrophoneAccess ? <Phone className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{hasMicrophoneAccess ? 'ПОЗВОНИТЬ' : 'РАЗРЕШИТЬ МИКРОФОН'}</span>
            </>
          )}
        </button>
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-xs text-center flex items-center justify-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
              Идет запись...
            </p>
          </div>
        )}
        
        {/* Error Message */}
        {status === 'error' && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-xs text-center">
              Ошибка подключения. Попробуйте еще раз.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallButton; 
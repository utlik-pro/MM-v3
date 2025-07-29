'use client';

import React, { useState, useEffect } from 'react';
import { Phone, X } from 'lucide-react';

interface CallButtonProps {
  onCallStart?: () => void;
}

const CallButton: React.FC<CallButtonProps> = ({ onCallStart }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [showWidget, setShowWidget] = useState(true);

  const handleCallClick = () => {
    setStatus('connecting');
    onCallStart?.();
    
    // Simulate connection
    setTimeout(() => {
      setStatus('connected');
    }, 2000);
  };

  const handleClose = () => {
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
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full opacity-80"></div>
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
                  <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-white rounded-full opacity-40"></div>
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
        
        {/* Call Button */}
        <button
          onClick={handleCallClick}
          disabled={status === 'connecting'}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-white text-sm
            flex items-center justify-center space-x-2 transition-all duration-200
            ${status === 'connecting' 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-teal-600 to-green-700 hover:from-teal-700 hover:to-green-800 active:scale-95'
            }
          `}
          aria-label="Позвонить"
        >
          {status === 'connecting' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>СОЕДИНЕНИЕ</span>
            </>
          ) : (
            <>
              <Phone className="w-4 h-4" />
              <span>ПОЗВОНИТЬ</span>
            </>
          )}
        </button>
        
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
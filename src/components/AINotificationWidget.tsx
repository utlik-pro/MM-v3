'use client';

import React, { useState } from 'react';
import { X, Phone, Loader2 } from 'lucide-react';

interface AINotificationWidgetProps {
  className?: string;
  onCall?: () => void;
  onClose?: () => void;
  status?: 'idle' | 'connecting' | 'connected' | 'completed';
}

export function AINotificationWidget({ 
  className = '', 
  onCall, 
  onClose,
  status = 'idle' 
}: AINotificationWidgetProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleCall = () => {
    onCall?.();
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white rounded-2xl border border-gray-300 shadow-lg p-4 w-80 h-40">
        {/* Header with close button */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3 flex-1">
            {/* AI Icon with sparkles */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 border-2 border-teal-300 flex items-center justify-center">
                <div className="relative">
                  {/* Sparkle icons */}
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-sm transform rotate-45"></div>
                  <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-white rounded-sm transform rotate-45"></div>
                  <div className="absolute top-0 right-0 w-1 h-1 bg-white rounded-sm transform rotate-45"></div>
                </div>
              </div>
            </div>
            
            {/* Text content */}
            <div className="flex-1">
              <p className="text-black text-sm font-medium leading-tight">
                Наш AI-помощник подберёт
              </p>
              <p className="text-black text-sm font-medium leading-tight">
                лучшие варианты новостроек
              </p>
              <p className="text-black text-sm font-medium leading-tight">
                под ваши запросы
              </p>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action button */}
        {status === 'connecting' ? (
          <div className="bg-white border border-gray-300 rounded-lg p-3 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              <span className="text-gray-400 text-sm font-medium">СОЕДИНЕНИЕ</span>
            </div>
          </div>
        ) : status === 'completed' ? (
          <button
            onClick={handleClose}
            className="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="font-medium">ЗАВЕРШИТЬ</span>
          </button>
        ) : (
          <button
            onClick={handleCall}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span className="font-medium">ПОЗВОНИТЬ</span>
          </button>
        )}
      </div>
    </div>
  );
}
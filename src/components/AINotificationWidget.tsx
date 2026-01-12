'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Phone, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'ai_widget_collapsed';
const COLLAPSE_TIMESTAMP_KEY = 'ai_widget_collapse_time';

interface AINotificationWidgetProps {
  className?: string;
  onCall?: () => void;
  onClose?: () => void;
  status?: 'idle' | 'connecting' | 'connected' | 'completed';
  /** Время в минутах до повторного показа развёрнутого виджета (по умолчанию 10) */
  reExpandDelayMinutes?: number;
}

export function AINotificationWidget({
  className = '',
  onCall,
  onClose,
  status = 'idle',
  reExpandDelayMinutes = 10
}: AINotificationWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [privacyPolicyChecked, setPrivacyPolicyChecked] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const reExpandTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reExpandDelay = reExpandDelayMinutes * 60 * 1000;

  // Инициализация состояния из localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const wasCollapsed = localStorage.getItem(STORAGE_KEY) === 'true';
    const collapseTimestamp = localStorage.getItem(COLLAPSE_TIMESTAMP_KEY);

    if (wasCollapsed && collapseTimestamp) {
      const timeSinceCollapse = Date.now() - parseInt(collapseTimestamp, 10);

      // Если прошло больше времени ожидания, показываем развёрнутый виджет
      if (timeSinceCollapse >= reExpandDelay) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(COLLAPSE_TIMESTAMP_KEY);
        setIsCollapsed(false);
      } else {
        // Иначе оставляем свёрнутым и ставим таймер на оставшееся время
        setIsCollapsed(true);
        const remainingTime = reExpandDelay - timeSinceCollapse;
        reExpandTimerRef.current = setTimeout(() => {
          handleExpand();
        }, remainingTime);
      }
    }

    return () => {
      if (reExpandTimerRef.current) {
        clearTimeout(reExpandTimerRef.current);
      }
    };
  }, [reExpandDelay]);

  // Обработка сворачивания виджета
  const handleCollapse = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsCollapsed(true);
      setIsAnimating(false);

      // Сохраняем состояние и время сворачивания
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.setItem(COLLAPSE_TIMESTAMP_KEY, Date.now().toString());

      // Устанавливаем таймер на повторное раскрытие
      if (reExpandTimerRef.current) {
        clearTimeout(reExpandTimerRef.current);
      }
      reExpandTimerRef.current = setTimeout(() => {
        handleExpand();
      }, reExpandDelay);

      onClose?.();
    }, 200);
  };

  // Обработка разворачивания виджета
  const handleExpand = () => {
    setIsCollapsed(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COLLAPSE_TIMESTAMP_KEY);

    if (reExpandTimerRef.current) {
      clearTimeout(reExpandTimerRef.current);
      reExpandTimerRef.current = null;
    }
  };

  const handleCall = () => {
    // Validate checkboxes
    if (!privacyPolicyChecked || !consentChecked) {
      setShowValidationError(true);
      setTimeout(() => setShowValidationError(false), 3000);
      return;
    }

    setShowValidationError(false);
    onCall?.();
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

  // Свёрнутое состояние - маленький кружок с иконкой телефона
  if (isCollapsed) {
    return (
      <div
        className={`fixed bottom-4 right-4 z-50 group ${className}`}
        style={{
          width: '56px',
          height: '56px',
          pointerEvents: 'none' // Контейнер не блокирует клики
        }}
      >
        <button
          onClick={handleExpand}
          className="relative w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
          style={{ pointerEvents: 'auto' }} // Только кнопка кликабельна
          aria-label="Открыть AI-помощника"
        >
          {/* Пульсирующее кольцо анимации */}
          <span className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-25"></span>
          <span className="absolute inset-0 rounded-full bg-teal-500 animate-pulse opacity-20"></span>

          {/* Иконка телефона */}
          <Phone className="w-6 h-6 text-white relative z-10 group-hover:rotate-12 transition-transform" />

          {/* Блестящий эффект */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full opacity-80"></span>
        </button>

        {/* Подсказка при наведении */}
        <div
          className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
            AI-консультант
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className={`bg-white rounded-2xl border border-gray-300 shadow-lg p-4 w-80 transition-all duration-200 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
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
          
          {/* Close button - сворачивает в кружок */}
          <button
            onClick={handleCollapse}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Свернуть"
          >
            <X className="w-4 h-4" />
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
              Я ознакомлен с <a href="https://bir.by/politike-v-otnoshenii-obrabotki-personalnyix-dannyix-potenczialnyix-klientov-v-ooo-bir-baj.html" target="_blank" rel="noopener noreferrer" className="font-medium text-teal-600 hover:text-teal-700 underline">Политикой обработки персональных данных</a>
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
              Я ознакомлен с условиями и даю <a href="https://bir.by/aiconsent.pdf" target="_blank" rel="noopener noreferrer" className="font-medium text-teal-600 hover:text-teal-700 underline">Согласие</a> на обработку моих персональных данных для получения консультации
            </span>
          </label>
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
            onClick={handleCollapse}
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

        {/* Info text */}
        <p className="mt-2 text-xs text-gray-500 text-center leading-tight">
          Без получения согласия консультация возможна только по телефону 7911
        </p>

        {/* Validation Error */}
        {showValidationError && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-xs text-center">
              Необходимо отметить оба чекбокса для продолжения
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
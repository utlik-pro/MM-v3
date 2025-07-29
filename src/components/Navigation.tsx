import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Home, 
  Users, 
  MessageSquare, 
  Brain, 
  Settings, 
  Monitor,
  Menu,
  X,
  ChevronRight,
  Bell
} from 'lucide-react';
import { useUnreadLeads } from '../hooks/useUnreadLeads';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Главная',
    href: '/',
    icon: Home,
    description: 'Главная страница и код виджета'
  },
  {
    name: 'Мониторинг лидов',
    href: '/lead-monitor',
    icon: Monitor,
    description: 'Отслеживание лидов в реальном времени'
  },
  {
    name: 'База знаний',
    href: '/knowledge-base',
    icon: Brain,
    description: 'Управление документами AI агента'
  },
  {
    name: 'Аналитика',
    href: '/admin',
    icon: Settings,
    description: 'Аналитика, настройки и экспорт данных'
  },
  {
    name: 'Документация',
    href: '/docs',
    icon: MessageSquare,
    description: 'Техническое руководство'
  },
  {
    name: 'Виджет',
    href: '/widget',
    icon: Users,
    description: 'Голосовой виджет'
  },
  {
    name: 'AI Уведомления',
    href: '/widget-demo',
    icon: Bell,
    description: 'Демо AI-уведомлений'
  }
];

interface NavigationProps {
  currentPage?: string;
}

// Компонент Badge для отображения количества непрочитанных
function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  
  return (
    <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function Navigation({ currentPage }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { unreadCount, markAllAsRead } = useUnreadLeads();

  const isCurrentPage = (href: string) => {
    if (href === '/' && router.pathname === '/') return true;
    if (href !== '/' && router.pathname.startsWith(href)) return true;
    return router.pathname === href;
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 bg-white shadow-sm border border-gray-200"
        >
          {isOpen ? (
            <X className="block h-6 w-6" />
          ) : (
            <Menu className="block h-6 w-6" />
          )}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">MinskMir</h1>
                <p className="text-xs text-gray-500">Голосовой ассистент</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const current = isCurrentPage(item.href);
              const isLeadMonitor = item.href === '/lead-monitor';
              
              const handleClick = () => {
                setIsOpen(false);
                // Отмечаем все лиды как прочитанные при переходе в мониторинг
                if (isLeadMonitor && unreadCount > 0) {
                  markAllAsRead();
                }
              };
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleClick}
                  className={`
                    group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors
                    ${current
                      ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`
                    flex-shrink-0 w-5 h-5 mr-3
                    ${current ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{item.name}</span>
                      {isLeadMonitor && <Badge count={unreadCount} />}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    )}
                  </div>
                  {current && (
                    <ChevronRight className="w-4 h-4 text-indigo-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Version 1.0.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 
import { useState } from 'react';
import Head from 'next/head';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Settings,
  Plus,
  Search,
  Bell,
  Menu,
  X
} from 'lucide-react';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    {
      name: 'Всего лидов',
      value: '127',
      change: '+12%',
      changeType: 'positive',
      icon: Users,
    },
    {
      name: 'Разговоров сегодня',
      value: '45',
      change: '+8%',
      changeType: 'positive',
      icon: MessageSquare,
    },
    {
      name: 'Конверсия',
      value: '23.5%',
      change: '+2.1%',
      changeType: 'positive',
      icon: TrendingUp,
    },
    {
      name: 'Средняя длительность',
      value: '3:42',
      change: '-15s',
      changeType: 'negative',
      icon: MessageSquare,
    },
  ];

  const navigation = [
    { name: 'Dashboard', href: '/admin', current: true },
    { name: 'Лиды', href: '/admin/leads', current: false },
    { name: 'Разговоры', href: '/admin/conversations', current: false },
    { name: 'Промты', href: '/admin/prompts', current: false },
    { name: 'Аналитика', href: '/admin/analytics', current: false },
    { name: 'Настройки', href: '/admin/settings', current: false },
  ];

  return (
    <>
      <Head>
        <title>Админка - Голосовой Ассистент MinskMir</title>
        <meta name="description" content="Панель управления голосовым ассистентом" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
            
            {/* Mobile sidebar */}
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
              <div className="flex h-16 items-center justify-between px-4">
                <h2 className="text-lg font-semibold text-gray-900">MinskMir Admin</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <nav className="mt-8 px-4">
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        item.current
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex flex-col flex-grow bg-white shadow-lg">
            <div className="flex h-16 items-center px-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">MinskMir Admin</h2>
            </div>
            
            <nav className="flex-1 px-4 py-6">
              <div className="space-y-1">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      item.current
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Header */}
          <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
            <div className="flex h-16 items-center gap-x-4 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="h-6 w-px bg-gray-200 lg:hidden" />

              <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="relative flex flex-1 items-center">
                  <Search className="pointer-events-none absolute left-4 h-5 w-5 text-gray-400" />
                  <input
                    className="block h-full w-full border-0 py-0 pl-11 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                    placeholder="Поиск..."
                    type="search"
                  />
                </div>
                
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                  <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                    <Bell className="h-6 w-6" />
                  </button>

                  <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

                  <div className="relative">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">АД</span>
                      </div>
                      <span className="hidden lg:flex lg:items-center lg:ml-3">
                        <span className="text-sm font-medium text-gray-700">Администратор</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard content */}
          <main className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Обзор активности голосового ассистента
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {stats.map((item) => (
                  <div
                    key={item.name}
                    className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 shadow sm:px-6 sm:pt-6"
                  >
                    <div>
                      <div className="absolute rounded-md bg-blue-500 p-3">
                        <item.icon className="h-6 w-6 text-white" />
                      </div>
                      <p className="ml-16 truncate text-sm font-medium text-gray-500">
                        {item.name}
                      </p>
                    </div>
                    <div className="ml-16 flex items-baseline">
                      <p className="text-2xl font-semibold text-gray-900">
                        {item.value}
                      </p>
                      <p
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          item.changeType === 'positive'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {item.change}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent activity */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent leads */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Последние лиды
                      </h3>
                      <a
                        href="/admin/leads"
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        Смотреть все
                      </a>
                    </div>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="space-y-4">
                      {[
                        { name: 'Иван Петров', phone: '+375 29 123-45-67', time: '10 минут назад' },
                        { name: 'Мария Сидорова', phone: '+375 33 987-65-43', time: '25 минут назад' },
                        { name: 'Алексей Волков', phone: '+375 25 555-11-22', time: '1 час назад' },
                      ].map((lead, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                            <p className="text-sm text-gray-500">{lead.phone}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">{lead.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent conversations */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Последние разговоры
                      </h3>
                      <a
                        href="/admin/conversations"
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        Смотреть все
                      </a>
                    </div>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="space-y-4">
                      {[
                        { duration: '4:32', status: 'Завершен', outcome: 'Лид захвачен', time: '5 минут назад' },
                        { duration: '2:15', status: 'Завершен', outcome: 'Информация', time: '15 минут назад' },
                        { duration: '6:48', status: 'Завершен', outcome: 'Лид захвачен', time: '30 минут назад' },
                      ].map((conversation, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Длительность: {conversation.duration}
                            </p>
                            <p className="text-sm text-gray-500">{conversation.outcome}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">{conversation.time}</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {conversation.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Быстрые действия</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <button className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:bg-gray-50">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600">
                        <Plus className="h-6 w-6" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        Создать промт
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Добавить новый промт для ассистента
                      </p>
                    </div>
                  </button>

                  <button className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:bg-gray-50">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-600">
                        <Users className="h-6 w-6" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        Экспорт лидов
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Скачать список лидов в Excel
                      </p>
                    </div>
                  </button>

                  <button className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:bg-gray-50">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-600">
                        <TrendingUp className="h-6 w-6" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        Отчет по конверсии
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Получить детальный отчет
                      </p>
                    </div>
                  </button>

                  <button className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:bg-gray-50">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-gray-50 text-gray-600">
                        <Settings className="h-6 w-6" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        Настройки
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Конфигурация ассистента
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
} 
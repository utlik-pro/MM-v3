import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Users, 
  Search, 
  Filter,
  Download,
  Eye,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  Check,
  X,
  Clock
} from 'lucide-react';

interface Lead {
  id: string;
  contactInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  status: string;
  score: number;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const statusOptions = [
    { value: 'all', label: 'Все статусы', count: 0 },
    { value: 'NEW', label: 'Новые', count: 0 },
    { value: 'CONTACTED', label: 'Связались', count: 0 },
    { value: 'QUALIFIED', label: 'Квалифицированные', count: 0 },
    { value: 'CONVERTED', label: 'Конвертированные', count: 0 },
    { value: 'CLOSED', label: 'Закрытые', count: 0 },
  ];

  useEffect(() => {
    fetchLeads();
  }, [searchTerm, statusFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/admin/leads?${params}`);
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/leads?id=${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchLeads(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      NEW: { color: 'bg-blue-100 text-blue-800', label: 'Новый' },
      CONTACTED: { color: 'bg-yellow-100 text-yellow-800', label: 'Связались' },
      QUALIFIED: { color: 'bg-purple-100 text-purple-800', label: 'Квалифицирован' },
      CONVERTED: { color: 'bg-green-100 text-green-800', label: 'Конвертирован' },
      CLOSED: { color: 'bg-gray-100 text-gray-800', label: 'Закрыт' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.NEW;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const exportLeads = () => {
    // В реальной системе здесь будет экспорт в CSV/Excel
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Имя,Телефон,Email,Статус,Оценка,Источник,Дата создания\n"
      + leads.map(lead => 
          `"${lead.contactInfo.name}","${lead.contactInfo.phone}","${lead.contactInfo.email || ''}","${lead.status}","${lead.score}","${lead.source}","${formatDate(lead.createdAt)}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Head>
        <title>Лиды - Админка MinskMir</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-gray-400 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">Лиды</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={exportLeads}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Экспорт
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени, телефону или email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Всего лидов</p>
                  <p className="text-2xl font-semibold text-gray-900">{leads.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Новые</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {leads.filter(lead => lead.status === 'NEW').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Check className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Конвертированные</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {leads.filter(lead => lead.status === 'CONVERTED').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">%</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Конверсия</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {leads.length > 0 ? Math.round((leads.filter(lead => lead.status === 'CONVERTED').length / leads.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Контакт
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Оценка
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Источник
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Загрузка...
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Лиды не найдены
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {lead.contactInfo.name}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {lead.contactInfo.phone}
                            </div>
                            {lead.contactInfo.email && (
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Mail className="h-3 w-3 mr-1" />
                                {lead.contactInfo.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(lead.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getScoreColor(lead.score)}`}>
                            {lead.score}/100
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lead.source === 'voice_widget' ? 'Голосовой виджет' : lead.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(lead.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              title="Просмотр"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {lead.status === 'NEW' && (
                              <button
                                onClick={() => updateLeadStatus(lead.id, 'CONTACTED')}
                                className="text-green-600 hover:text-green-900"
                                title="Отметить как связались"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            
                            <button
                              className="text-gray-400 hover:text-gray-600"
                              title="Еще действия"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 
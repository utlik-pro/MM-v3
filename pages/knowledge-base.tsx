import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Link, 
  Upload, 
  Trash2, 
  Plus, 
  Search, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Globe,
  File,
  Calendar,
  User,
  Settings,
  Edit,
  Eye,
  Save,
  X,
  Brain,
  Shield,
  ShieldCheck
} from 'lucide-react';
import Navigation from '../src/components/Navigation';
import { KnowledgeBaseDocument, KnowledgeBaseListResponse } from '../src/types/knowledge-base';

// Add interface for agent attachment status
interface AgentAttachmentStatus {
  [documentId: string]: boolean;
}

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [addMode, setAddMode] = useState<'text' | 'url' | 'file'>('text');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Agent attachment status
  const [agentAttachmentStatus, setAgentAttachmentStatus] = useState<AgentAttachmentStatus>({});
  const [statusLoading, setStatusLoading] = useState<{[documentId: string]: boolean}>({});
  
  // Selected document for viewing/editing
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeBaseDocument | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [editingContent, setEditingContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);

  // Form states
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');

  // Function to check agent attachment status for a document
  const checkAgentAttachmentStatus = async (documentId: string) => {
    try {
      setStatusLoading(prev => ({ ...prev, [documentId]: true }));
      
      const response = await fetch(`/api/knowledge-base/get-dependent-agents?documentation_id=${documentId}`);
      if (!response.ok) {
        console.error('Failed to get dependent agents for document:', documentId);
        return;
      }
      
      const data = await response.json();
      setAgentAttachmentStatus(prev => ({
        ...prev,
        [documentId]: data.is_attached_to_our_agent || false
      }));
    } catch (error) {
      console.error('Error checking agent attachment status:', error);
    } finally {
      setStatusLoading(prev => ({ ...prev, [documentId]: false }));
    }
  };

  // Function to check status for all documents
  const checkAllDocumentsStatus = async () => {
    if (documents.length === 0) return;
    
    const promises = documents.map(doc => checkAgentAttachmentStatus(doc.id));
    await Promise.all(promises);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Check agent attachment status when documents are loaded
  useEffect(() => {
    if (documents.length > 0) {
      checkAllDocumentsStatus();
    }
  }, [documents]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/knowledge-base/list?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data: KnowledgeBaseListResponse = await response.json();
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот документ?')) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Step 1: Remove from agent if attached
      if (agentAttachmentStatus[documentId]) {
        const removeResponse = await fetch('/api/knowledge-base/remove-from-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documentation_id: documentId
          }),
        });
        
        if (!removeResponse.ok) {
          const removeError = await removeResponse.json().catch(() => ({ error: 'Failed to remove from agent' }));
          console.error('Remove from agent error:', removeResponse.status, removeError);
          setError('Не удалось отвязать документ от агента');
          return;
        }
        
        console.log('Document removed from agent');
      }
      
      // Step 2: Delete the document itself
      const response = await fetch(`/api/knowledge-base/delete?documentation_id=${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Delete error:', response.status, errorData);
        
        // Check if it's still the dependency error
        if (errorData.details && errorData.details.includes('document_has_dependent_agents')) {
          setError('Документ все еще привязан к агентам. Попробуйте еще раз через несколько секунд.');
        } else {
          setError(errorData.error || `Ошибка удаления: ${response.status}`);
        }
        return;
      }
      
      setSuccess('Документ успешно удален');
      
      // Remove from local state immediately
      setAgentAttachmentStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[documentId];
        return newStatus;
      });
      
      // Refresh documents list
      await fetchDocuments();
      
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка при удалении');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromAgent = async (documentId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/knowledge-base/remove-from-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentation_id: documentId
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.was_attached) {
          setSuccess('Документ успешно отвязан от агента');
        } else {
          setSuccess('Документ не был привязан к агенту');
        }
        
        // Update agent attachment status
        setTimeout(async () => {
          await checkAgentAttachmentStatus(documentId);
        }, 1000);
      } else {
        const error = await response.json();
        console.error('Error removing from agent:', error);
        setError('Ошибка отвязки от агента');
      }
    } catch (error) {
      console.error('Error removing from agent:', error);
      setError('Ошибка отвязки от агента');
    } finally {
      setLoading(false);
    }
  };

  const handleComputeRAGIndex = async (documentId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Step 1: Compute RAG index
      const ragResponse = await fetch('/api/knowledge-base/compute-rag-index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentation_id: documentId,
          model: 'multilingual_e5_large_instruct'
        }),
      });
      
      if (!ragResponse.ok) {
        const error = await ragResponse.json();
        console.error('Error computing RAG index:', error);
        setError('Ошибка вычисления RAG индекса');
        return;
      }
      
      const ragResult = await ragResponse.json();
      console.log('RAG index computed:', ragResult);
      
      // Step 2: Add document to agent (regardless of RAG status)
      const agentResponse = await fetch('/api/knowledge-base/add-to-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentation_id: documentId
        }),
      });
      
      if (agentResponse.ok) {
        setSuccess('Документ успешно привязан к агенту');
        
        // Update agent attachment status after successful addition
        setTimeout(async () => {
          await checkAgentAttachmentStatus(documentId);
        }, 1000); // Wait 1 second for changes to propagate
      } else {
        const agentError = await agentResponse.json();
        console.error('Error adding to agent:', agentError);
        
        if (ragResult.status === 'document_too_small') {
          setError('Документ слишком мал для RAG-индексации, но попытка привязки к агенту не удалась');
        } else {
          setError('RAG-индекс вычислен, но не удалось привязать к агенту');
        }
      }
      
    } catch (error) {
      console.error('Error in RAG indexing process:', error);
      setError('Ошибка процесса привязки к агенту');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let response;
      
      if (addMode === 'text') {
        response = await fetch('/api/knowledge-base/create-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textContent,
            name: documentName || null
          }),
        });
      } else if (addMode === 'url') {
        response = await fetch('/api/knowledge-base/create-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: urlContent,
            name: documentName || null
          }),
        });
      } else if (addMode === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile!);
        if (documentName) formData.append('name', documentName);
        
        response = await fetch('/api/knowledge-base/create-file', {
          method: 'POST',
          body: formData,
        });
      }

      if (!response || !response.ok) {
        throw new Error('Failed to create document');
      }

      const result = await response.json();
      setSuccess('Document created successfully');
      setShowAddModal(false);
      resetForm();
      
      // Refresh documents and check status
      await fetchDocuments();
      
      // If document was created, check its agent attachment status after a short delay
      if (result.id) {
        setTimeout(() => {
          checkAgentAttachmentStatus(result.id);
        }, 2000); // Wait 2 seconds for RAG processing to complete
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTextContent('');
    setUrlContent('');
    setSelectedFile(null);
    setDocumentName('');
  };

  // Fetch document content for viewing/editing
  const fetchDocumentContent = async (documentId: string) => {
    try {
      setLoadingContent(true);
      const response = await fetch(`/api/knowledge-base/get-document?documentation_id=${documentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch document content');
      }
      const data = await response.json();
      // Extract content based on document type
      let content = '';
      if (data.content) {
        content = data.content;
      } else if (data.extracted_inner_html) {
        content = data.extracted_inner_html;
      } else if (data.url) {
        content = `URL: ${data.url}`;
      } else {
        content = 'Содержимое недоступно для просмотра';
      }
      setDocumentContent(content);
      setEditingContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setDocumentContent('Ошибка загрузки содержимого');
    } finally {
      setLoadingContent(false);
    }
  };

  // Handle view document
  const handleViewDocument = async (document: KnowledgeBaseDocument) => {
    setSelectedDocument(document);
    setShowViewModal(true);
    await fetchDocumentContent(document.id);
  };

  // Handle edit document
  const handleEditDocument = async (document: KnowledgeBaseDocument) => {
    setSelectedDocument(document);
    setShowEditModal(true);
    await fetchDocumentContent(document.id);
  };

  // Save edited content (Note: API doesn't support direct content editing)
  // This is a placeholder for future enhancement
  const handleSaveEdit = async () => {
    if (!selectedDocument) return;
    
    try {
      setSubmitting(true);
      // For now, we'll show a message that direct editing isn't supported
      // In a real implementation, you might need to delete and recreate the document
      setError('Прямое редактирование документов пока не поддерживается. Удалите документ и создайте новый с обновленным содержимым.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (unixSecs: number) => {
    return new Date(unixSecs * 1000).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'url': return <Globe className="w-5 h-5 text-blue-500" />;
      case 'file': return <File className="w-5 h-5 text-green-500" />;
      case 'text': return <FileText className="w-5 h-5 text-purple-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <Navigation />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">База знаний</h1>
                <p className="text-sm text-gray-500">Управление документами AI агента</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить документ
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
        {/* Search and Controls */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchDocuments}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={checkAllDocumentsStatus}
                disabled={Object.keys(statusLoading).some(key => statusLoading[key])}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                title="Обновить статусы привязки к агенту"
              >
                <ShieldCheck className={`w-4 h-4 mr-2 ${Object.keys(statusLoading).some(key => statusLoading[key]) ? 'animate-pulse' : ''}`} />
                Статусы
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
            <div className="flex">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5" />
              <div className="text-sm text-green-800">{success}</div>
            </div>
          </div>
        )}

          {/* Documents List */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Загрузка документов...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Документы не найдены</h3>
              <p className="text-gray-500 mb-6">Добавьте первый документ в базу знаний</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить документ
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="overflow-hidden">
                {documents.map((doc, index) => (
                  <div 
                    key={doc.id} 
                    className={`p-6 border-gray-200 hover:bg-gray-50 transition-colors ${
                      index !== documents.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {getDocumentIcon(doc.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900 truncate">{doc.name}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                              {doc.type}
                            </span>
                            {/* Agent Attachment Status */}
                            {statusLoading[doc.id] ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                Проверка...
                              </span>
                            ) : agentAttachmentStatus[doc.id] ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                Привязан к агенту
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                <Shield className="w-3 h-3 mr-1" />
                                Не привязан
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(doc.metadata.created_at_unix_secs)}
                            </div>
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {doc.access_info.creator_name}
                            </div>
                            <div className="flex items-center">
                              <File className="w-4 h-4 mr-1" />
                              {formatSize(doc.metadata.size_bytes)}
                            </div>
                          </div>
                          {doc.url && (
                            <div className="mt-1 flex items-center text-sm text-blue-600">
                              <Link className="w-4 h-4 mr-1" />
                              <a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:underline truncate"
                              >
                                {doc.url}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Просмотреть"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditDocument(doc)}
                          className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {/* Show attach or detach button based on current status */}
                        {agentAttachmentStatus[doc.id] ? (
                          <button
                            onClick={() => handleRemoveFromAgent(doc.id)}
                            className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Отвязать от агента"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleComputeRAGIndex(doc.id)}
                            className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Привязать к агенту (вычислить RAG индекс)"
                          >
                            <Brain className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Knowledge Document</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Document Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Document Type</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setAddMode('text')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      addMode === 'text'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <FileText className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                    <div className="text-sm font-medium">Text</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('url')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      addMode === 'url'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Globe className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-sm font-medium">URL</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('file')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      addMode === 'file'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <div className="text-sm font-medium">File</div>
                  </button>
                </div>
              </div>

              {/* Document Name */}
              <div>
                <label htmlFor="documentName" className="block text-sm font-medium text-gray-700 mb-2">
                  Document Name (optional)
                </label>
                <input
                  type="text"
                  id="documentName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Enter a name for this document"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Content Input based on mode */}
              {addMode === 'text' && (
                <div>
                  <label htmlFor="textContent" className="block text-sm font-medium text-gray-700 mb-2">
                    Text Content *
                  </label>
                  <textarea
                    id="textContent"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    required
                    rows={8}
                    placeholder="Enter your text content here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}

              {addMode === 'url' && (
                <div>
                  <label htmlFor="urlContent" className="block text-sm font-medium text-gray-700 mb-2">
                    URL *
                  </label>
                  <input
                    type="url"
                    id="urlContent"
                    value={urlContent}
                    onChange={(e) => setUrlContent(e.target.value)}
                    required
                    placeholder="https://example.com/documentation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}

              {addMode === 'file' && (
                <div>
                  <label htmlFor="fileContent" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File *
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="fileContent"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="fileContent"
                            type="file"
                            className="sr-only"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            required
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF, DOC, TXT up to 10MB</p>
                      {selectedFile && (
                        <p className="text-sm text-green-600 font-medium">{selectedFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Document
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {showViewModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Просмотр документа</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedDocument(null);
                  setDocumentContent('');
                }}
                className="p-2 text-gray-400 hover:text-gray-500 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedDocument.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="capitalize bg-gray-100 px-2 py-1 rounded">{selectedDocument.type}</span>
                  <span>{formatDate(selectedDocument.metadata.created_at_unix_secs)}</span>
                  <span>{formatSize(selectedDocument.metadata.size_bytes)}</span>
                </div>
              </div>
              
              {loadingContent ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500">Загрузка содержимого...</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">{documentContent}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Редактирование документа</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedDocument(null);
                  setEditingContent('');
                }}
                className="p-2 text-gray-400 hover:text-gray-500 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedDocument.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="capitalize bg-gray-100 px-2 py-1 rounded">{selectedDocument.type}</span>
                  <span>{formatDate(selectedDocument.metadata.created_at_unix_secs)}</span>
                  <span>{formatSize(selectedDocument.metadata.size_bytes)}</span>
                </div>
              </div>
              
              {loadingContent ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500">Загрузка содержимого...</p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                  <div className="mb-4">
                    <label htmlFor="editContent" className="block text-sm font-medium text-gray-700 mb-2">
                      Содержимое документа
                    </label>
                    <textarea
                      id="editContent"
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                      placeholder="Содержимое документа..."
                    />
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex">
                      <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p><strong>Внимание:</strong> Система не поддерживает прямое редактирование документов.</p>
                        <p>Для обновления содержимого необходимо удалить текущий документ и создать новый.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedDocument(null);
                        setEditingContent('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Сохранить
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
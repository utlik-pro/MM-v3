// ElevenLabs API Types

export interface ElevenLabsConfig {
  apiKey: string
  baseURL?: string
  timeout?: number
  maxRetries?: number
}

// Conversation Types
export interface ConversationListParams {
  cursor?: string
  agent_id?: string
  call_successful?: 'success' | 'failure' | 'unknown'
  call_start_before_unix?: number
  call_start_after_unix?: number
  page_size?: number
}

export interface ConversationListResponse {
  conversations: Conversation[]
  has_more: boolean
  next_cursor?: string
}

export interface Conversation {
  agent_id: string
  conversation_id: string
  start_time_unix_secs: number
  call_duration_secs: number
  message_count: number
  status: 'initiated' | 'ongoing' | 'ended'
  call_successful: 'success' | 'failure' | 'unknown'
  agent_name: string
}

export interface ConversationDetail extends Conversation {
  transcript?: ConversationMessage[]
  metadata?: Record<string, any>
  end_time_unix_secs?: number
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp_unix_secs: number
  metadata?: Record<string, any>
}

// Tools Types
export interface Tool {
  id: string
  tool_config: ToolConfig
  access_info: ToolAccessInfo
}

export interface ToolConfig {
  name: string
  description?: string
  parameters?: Record<string, any>
  webhook?: WebhookConfig
  dynamic_variables?: DynamicVariables
}

export interface WebhookConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  auth_connection?: AuthConnection
  path_params_schema?: Record<string, any>
  query_params_schema?: Record<string, any>
  request_body_schema?: Record<string, any>
}

export interface AuthConnection {
  auth_connection_id: string
}

export interface DynamicVariables {
  dynamic_variable_placeholders: Record<string, any>
}

export interface ToolAccessInfo {
  is_creator: boolean
  creator_name?: string
  creator_email?: string
  role: 'admin' | 'editor' | 'viewer'
}

// Knowledge Base Types
export interface KnowledgeDocument {
  id: string
  title: string
  content: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface DocumentUpload {
  title: string
  content: string
  metadata?: Record<string, any>
}

// API Response Types
export interface APIResponse<T> {
  data?: T
  error?: APIError
  success: boolean
}

export interface APIError {
  code?: string
  message: string
  details?: any
}

// Rate Limiting
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
}

// Request Configuration
export interface RequestConfig {
  timeout?: number
  retries?: number
  headers?: Record<string, string>
}

// Lead/Contact Information Types (for webhook data)
export interface LeadData {
  contact_info: {
    name?: string
    phone?: string
    email?: string
  }
  conversation_id: string
  agent_id: string
  conversation_summary?: string
  call_duration_secs: number
  call_successful: 'success' | 'failure' | 'unknown'
  extracted_entities?: Record<string, any>
  metadata?: Record<string, any>
} 
import {
  ElevenLabsConfig,
  ConversationListParams,
  ConversationListResponse,
  ConversationDetail,
  Tool,
  ToolConfig,
  KnowledgeDocument,
  DocumentUpload,
  APIResponse,
  APIError,
  RateLimitInfo,
  RequestConfig
} from './types'

export class ElevenLabsClient {
  private config: Required<ElevenLabsConfig>
  private rateLimitInfo: RateLimitInfo | null = null

  constructor(config: ElevenLabsConfig) {
    this.config = {
      baseURL: 'https://api.elevenlabs.io/v1',
      timeout: 30000,
      maxRetries: 3,
      ...config
    }
  }

  // Base HTTP request method with retry logic
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`
    const timeout = config.timeout || this.config.timeout
    const maxRetries = config.retries || this.config.maxRetries

    const headers = {
      'xi-api-key': this.config.apiKey,
      'Content-Type': 'application/json',
      ...config.headers,
      ...options.headers
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        // Update rate limit info from headers
        this.updateRateLimitInfo(response)

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response)
          
          // Don't retry on 4xx errors (except 429 - rate limit)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            return {
              success: false,
              error: errorData
            }
          }
          
          throw new Error(`HTTP ${response.status}: ${errorData.message}`)
        }

        // Parse successful response
        const data = await response.json()
        return {
          success: true,
          data
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Don't retry on abort (timeout) or non-retryable errors
        if (error instanceof Error && error.name === 'AbortError') {
          break
        }
        
        // Exponential backoff for retries
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          await this.sleep(delay)
        }
      }
    }

    return {
      success: false,
      error: {
        message: lastError?.message || 'Request failed after retries',
        details: lastError
      }
    }
  }

  private async parseErrorResponse(response: Response): Promise<APIError> {
    try {
      const data = await response.json()
      return {
        code: data.code || response.status.toString(),
        message: data.message || data.error || response.statusText,
        details: data
      }
    } catch {
      return {
        code: response.status.toString(),
        message: response.statusText || 'Unknown error'
      }
    }
  }

  private updateRateLimitInfo(response: Response): void {
    const limit = response.headers.get('x-ratelimit-limit')
    const remaining = response.headers.get('x-ratelimit-remaining')
    const reset = response.headers.get('x-ratelimit-reset')

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10)
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Rate limit info getter
  public getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo
  }

  // Conversations API
  public async listConversations(
    params: ConversationListParams = {}
  ): Promise<APIResponse<ConversationListResponse>> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    const endpoint = `/convai/conversations?${searchParams.toString()}`
    return this.request<ConversationListResponse>(endpoint)
  }

  public async getConversation(
    conversationId: string
  ): Promise<APIResponse<ConversationDetail>> {
    const endpoint = `/convai/conversations/${conversationId}`
    return this.request<ConversationDetail>(endpoint)
  }

  public async getConversationAudio(
    conversationId: string
  ): Promise<APIResponse<ArrayBuffer>> {
    // Используем правильный endpoint согласно документации
    const endpoint = `/convai/conversations/${conversationId}/audio`
    
    try {
      console.log(`🎵 Fetching audio from: ${this.config.baseURL}${endpoint}`)
      
      // Прямой fetch для аудио данных (не JSON)
      const response = await fetch(`${this.config.baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.config.apiKey,
          'Accept': 'audio/mpeg, audio/wav, audio/*, */*',
          'User-Agent': 'ElevenLabs-Client/1.0'
        }
      })

      console.log(`📡 Audio response status: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Audio fetch failed: ${response.status} - ${errorText}`)
        
        return {
          success: false,
          error: {
            message: `Audio fetch failed: ${response.status} ${response.statusText}`,
            details: { errorText, status: response.status }
          }
        }
      }

      // Проверяем Content-Type
      const contentType = response.headers.get('content-type')
      console.log(`🎵 Audio content-type: ${contentType}`)
      
      const audioBuffer = await response.arrayBuffer()
      console.log(`✅ Audio buffer size: ${audioBuffer.byteLength} bytes`)
      
      return {
        success: true,
        data: audioBuffer
      }
    } catch (error) {
      console.error(`❌ Audio request error:`, error)
      return {
        success: false,
        error: {
          message: 'Failed to fetch conversation audio',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  // Tools API
  public async listTools(): Promise<APIResponse<{ tools: Tool[] }>> {
    const endpoint = '/convai/tools'
    return this.request<{ tools: Tool[] }>(endpoint)
  }

  public async getTool(toolId: string): Promise<APIResponse<Tool>> {
    const endpoint = `/convai/tools/${toolId}`
    return this.request<Tool>(endpoint)
  }

  public async createTool(toolConfig: ToolConfig): Promise<APIResponse<Tool>> {
    const endpoint = '/convai/tools'
    return this.request<Tool>(endpoint, {
      method: 'POST',
      body: JSON.stringify(toolConfig)
    })
  }

  public async updateTool(
    toolId: string,
    toolConfig: Partial<ToolConfig>
  ): Promise<APIResponse<Tool>> {
    const endpoint = `/convai/tools/${toolId}`
    return this.request<Tool>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(toolConfig)
    })
  }

  public async deleteTool(toolId: string): Promise<APIResponse<void>> {
    const endpoint = `/convai/tools/${toolId}`
    return this.request<void>(endpoint, {
      method: 'DELETE'
    })
  }

  // Knowledge Base API (placeholder - actual API endpoints may vary)
  public async listKnowledgeDocuments(): Promise<APIResponse<KnowledgeDocument[]>> {
    const endpoint = '/convai/knowledge-base'
    return this.request<KnowledgeDocument[]>(endpoint)
  }

  public async uploadDocument(
    document: DocumentUpload
  ): Promise<APIResponse<KnowledgeDocument>> {
    const endpoint = '/convai/knowledge-base'
    return this.request<KnowledgeDocument>(endpoint, {
      method: 'POST',
      body: JSON.stringify(document)
    })
  }

  public async deleteDocument(documentId: string): Promise<APIResponse<void>> {
    const endpoint = `/convai/knowledge-base/${documentId}`
    return this.request<void>(endpoint, {
      method: 'DELETE'
    })
  }

  // Health check
  public async healthCheck(): Promise<APIResponse<{ status: string }>> {
    try {
      // Use a simple endpoint to check API connectivity
      const response = await this.listConversations({ page_size: 1 })
      
      if (response.success) {
        return {
          success: true,
          data: { status: 'healthy' }
        }
      } else {
        return {
          success: false,
          error: {
            message: 'API health check failed',
            details: response.error
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'API health check failed',
          details: error
        }
      }
    }
  }
}

// Factory function for creating client instances
export function createElevenLabsClient(config: ElevenLabsConfig): ElevenLabsClient {
  return new ElevenLabsClient(config)
} 
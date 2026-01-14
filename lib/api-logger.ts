import { supabase } from './supabase'

interface ApiLogEntry {
  serviceName: string
  endpoint: string
  method: string
  statusCode?: number
  responseTimeMs?: number
  errorMessage?: string
  metadata?: any
}

export class ApiLogger {
  static async log(entry: ApiLogEntry): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_logs')
        .insert({
          service_name: entry.serviceName,
          endpoint: entry.endpoint,
          method: entry.method,
          status_code: entry.statusCode,
          response_time_ms: entry.responseTimeMs,
          error_message: entry.errorMessage,
          metadata: entry.metadata
        })

      if (error) {
        console.error('Failed to log API call:', error)
      }
    } catch (error) {
      console.error('API logger error:', error)
    }
  }

  static async logElevenLabsCall(
    endpoint: string,
    method: string,
    statusCode?: number,
    responseTimeMs?: number,
    errorMessage?: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      serviceName: 'elevenlabs',
      endpoint,
      method,
      statusCode,
      responseTimeMs,
      errorMessage,
      metadata
    })
  }

  static async logSupabaseCall(
    endpoint: string,
    method: string,
    statusCode?: number,
    responseTimeMs?: number,
    errorMessage?: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      serviceName: 'supabase',
      endpoint,
      method,
      statusCode,
      responseTimeMs,
      errorMessage,
      metadata
    })
  }
}

// Performance tracking utility
export function trackApiCall<T>(
  apiCall: () => Promise<T>,
  serviceName: string,
  endpoint: string,
  method: string
): Promise<T> {
  const startTime = Date.now()
  
  return apiCall()
    .then(result => {
      const responseTime = Date.now() - startTime
      ApiLogger.log({
        serviceName,
        endpoint,
        method,
        statusCode: 200,
        responseTimeMs: responseTime
      })
      return result
    })
    .catch(error => {
      const responseTime = Date.now() - startTime
      ApiLogger.log({
        serviceName,
        endpoint,
        method,
        statusCode: error.status || 500,
        responseTimeMs: responseTime,
        errorMessage: error.message || String(error),
        metadata: { error: String(error) }
      })
      throw error
    })
} 
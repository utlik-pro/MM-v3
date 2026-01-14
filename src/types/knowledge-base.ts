export interface KnowledgeBaseDocument {
  id: string;
  name: string;
  metadata: {
    created_at_unix_secs: number;
    last_updated_at_unix_secs: number;
    size_bytes: number;
  };
  supported_usages: string[];
  access_info: {
    is_creator: boolean;
    creator_name: string;
    creator_email: string;
    role: string;
  };
  dependent_agents: Array<{
    type: string;
  }>;
  type: 'file' | 'url' | 'text';
  url?: string;
  extracted_inner_html?: string;
}

export interface KnowledgeBaseListResponse {
  documents: KnowledgeBaseDocument[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface CreateDocumentResponse {
  id: string;
  name: string;
}

export interface CreateDocumentFromTextRequest {
  text: string;
  name?: string;
}

export interface CreateDocumentFromUrlRequest {
  url: string;
  name?: string;
}

export interface CreateDocumentFromFileRequest {
  file: File;
  name?: string;
} 
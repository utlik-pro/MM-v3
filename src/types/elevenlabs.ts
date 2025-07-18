export interface ElevenLabsSignedUrlResponse {
  signed_url: string;
}

export interface ElevenLabsConversationTokenResponse {
  token: string;
}

export interface DynamicVariables {
  [key: string]: string | number | boolean;
}

export interface ClientTools {
  [toolName: string]: (...args: any[]) => any;
}

export interface ConversationConfig {
  agentId?: string;
  signedUrl?: string;
  conversationToken?: string;
  dynamicVariables?: DynamicVariables;
  clientTools?: ClientTools;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: string) => void;
  onError?: (error: Error) => void;
  onModeChange?: (mode: { mode: 'speaking' | 'listening' }) => void;
}

export interface WidgetConfig {
  agentId: string;
  serverLocation?: 'us';
  variant?: 'expanded' | 'full' | 'expandable';
  avatarImageUrl?: string;
  avatarOrbColor1?: string;
  avatarOrbColor2?: string;
  actionText?: string;
  startCallText?: string;
  endCallText?: string;
  expandText?: string;
  listeningText?: string;
  speakingText?: string;
  dynamicVariables?: DynamicVariables;
  overrideLanguage?: string;
  overridePrompt?: string;
  overrideFirstMessage?: string;
  overrideVoiceId?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
} 
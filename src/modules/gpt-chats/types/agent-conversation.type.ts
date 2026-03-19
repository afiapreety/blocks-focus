import {
  ConversationFilters,
  ConversationMetadata,
  TokenUsage,
  WorkflowTrace,
} from './conversation.service.type';

export interface AgentConversationSession {
  _id: string;
  SessionId: string;
  WidgetId: string;
  AgentId: string;
  CreatedAt: string;
  Query: string;
  QueryId: string;
  Response: string;
  NextStepQuestions: string[];
  ResponseId: string;
  Filters?: ConversationFilters;
  // Sources: ConversationSource[];
  // GuardrailViolations: string[];
  Metadata: ConversationMetadata;
  QueryTimestamp: string;
  ResponseTimestamp: string;
  ConversationType: string;
  UserId: string;
  UserEmail: string;
  UserRole: string[];
  Summary: string | null;
  Playground: boolean;
  IsPrivate: boolean;
  WorkflowName: string;
  TokenUsage: TokenUsage;
  // TokenReport: Record<string, TokenReportNode>;
  WorkflowTrace: WorkflowTrace;
  Error: string | null;
}

export interface AgentConversationSessionSummary {
  agent_id: string;
  widget_id: string;
  session_id: string;
  created_at: string;
  last_entry_date: string;
  total_count: number;
  conversation: {
    _id: string;
    SessionId: string;
    WidgetId: string;
    AgentId: string;
    CreatedAt: string;
    Query: string;
    QueryId: string;
    Response: string;
    ResponseId: string;
    // GuardrailViolations: string[];
    Metadata: {
      processing_time: number;
      total_tokens: number;
      prompt_tokens: number;
      completion_tokens: number;
      word_count: number;
      source_count: number;
      total_messages_in_history: number;
      kb_ids: string[] | null;
      tool_calls_made: number;
      summary_updated: boolean;
    };
    QueryTimestamp: string;
    ResponseTimestamp: string;
    ConversationType: string;
    UserId: string;
    UserEmail: string;
    UserRole: string[];
    Summary: string;
    Playground: boolean;
  };
}

export interface IAgentConversationConfigPayload {
  widget_id: string;
  project_key: string;
  application_domain: string;
}

export interface IAgentConversationInitiatePayload {
  widget_id: string;
  project_key: string;
  session_id?: string;
}

export interface IAgentConversationInitiateResponse {
  session_id: string;
  token: string;
  websocket_url: string;
  expires_at: string;
  is_success: boolean;
  detail: string;
}

export interface IAgentConversationListPayload {
  allow_created_by_filter?: boolean;
  agent_id: string;
  project_key: string;
  limit: number;
  offset: number;
}

export interface IAgentConversationListResponse {
  sessions: AgentConversationSessionSummary[];
  total_count: 0;
}

export interface IAgentConversationByIdPayload {
  allow_created_by_filter: boolean;
  widget_id?: string;
  session_id: string;
  agent_id: string;
  limit: number;
  offset: number;
  project_key: string;
}

export interface IAgentConversationByIdResponse {
  sessions: AgentConversationSession[];
  total_count: number;
}

export interface AgentConversationDetails {
  _id?: string;
  Response?: string;
  Query?: string;
  QueryTimestamp: string | number | Date;
  ResponseTimestamp: string | number | Date;
  QueryId?: string;
  Sources: string[];
  Summary: string;
}

export interface AgentConversation {
  sessionId: string;
  lastMessage: string;
  createDate: string;
  lastUpdated: string;
  widget_id: string;
  agentId: string;
  playground: boolean;
}

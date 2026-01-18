export enum WidgetType {
  CHAT = 'chat',
  CALL = 'call',
}
export type WidgetSetting = {
  widget_type: WidgetType;
  fe_style: string;
};

export type Widget = {
  name: string;
  widget_settings: WidgetSetting[];
  logo_url: string;
  logo_id: string | null;
  fe_script: string | null;
  show_agent_name: boolean;
  greeting: string;
  site_url: string | null;
  brand_color: string | null;
  predefined_questions: string[];
  enable_predefined_questions: boolean;
  enable_questions_suggestions: boolean;
};

export type WidgetColorPalette = {
  'chat-header--background-start-color': string;
  'chat-header--background-end-color': string;
  'chat-header--title-color': string;
  'chat-window--background-color': string;
  'chat-window--font-color': string;
  'send-button--background-color': string;
  'send-button--font-color': string;
  'chat--border-color': string;
  'chat-toggle-button--background-color': string;
  'chat-toggle-button--color': string;
};

export interface ConversationFilters {
  agent_id: string;
  tenant_id: string;
}

export interface ConversationSource {
  id?: string | null;
  metadata: {
    score?: number;
    dense_score?: number;
    rank?: number;
    kb_id?: string;
    source?: unknown;
    chunk_id?: unknown;
    [key: string]: unknown;
  };
  page_content: string;
  type?: string;
}

export interface ConversationFilters {
  agent_id: string;
  tenant_id: string;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  model?: string | null;
  provider?: string | null;
  operation?: string | null;
}

export interface TokenReportNode {
  node_type: string;
  tokens_used: TokenUsage;
  duration: number;
  success: boolean;
  start_ts: number;
  end_ts: number;
  error: any | null;
}

export interface WorkflowNodeConfig {
  [key: string]: unknown;
}

export interface WorkflowGraphNode {
  node_id: string;
  node_type: string;
  enabled: boolean;
  config: WorkflowNodeConfig;
  position: number;
}

export interface WorkflowGraphEdge {
  from_node: string;
  to_node: string;
  condition: string;
  condition_params: Record<string, unknown>;
}

export interface WorkflowGlobalConfig {
  max_plan_tasks?: number;
  enable_parallel_execution?: boolean;
  max_concurrent_tasks?: number;
  serialize_llm_calls?: boolean;
  greeting_classification_enabled?: boolean;
  [key: string]: unknown;
}

export interface WorkflowConfig {
  workflow_name: string;
  description: string;
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
  entry_point: string;
  global_config: WorkflowGlobalConfig;
}

export interface ConversationMetadata {
  query_type?: string;
  response_strategy?: string;
  processing_time?: number;
  workflow_config?: WorkflowConfig;
  nodes_executed?: number;
  edges_taken?: number;
  kb_ids?: string[];
  [key: string]: unknown;
}

export interface WorkflowTraceNode {
  node_id: string;
  node_type: string;
  // start_ts: number;
  // end_ts: number;
  // start_mono?: number;
  // end_mono?: number;
  duration: number;
  success: boolean;
  error: string | null;
  // input_snapshot?: unknown;
  // output_snapshot?: unknown;
  tokens_used: TokenUsage;
  // metadata: Record<string, unknown> | null;
  // start_timestamp: string;
  // end_timestamp: string;
  name?: string;
  started_at?: number;
  started_at_str?: string;
  completed_at?: number;
  completed_at_str?: string;
}

export interface WorkflowTraceEdge {
  from_node: string;
  to_node: string;
  condition: string;
  timestamp: number;
  taken: boolean;
  condition_result: boolean;
  condition_context?: unknown;
  error: string | null;
  timestamp_str: string;
  context?: WorkflowTraceContext;
}

export interface WorkflowTraceContext {
  has_error: boolean;
  params: Record<string, unknown>;
}

export interface WorkflowTraceMessage {
  type: string;
  content: string;
  additional_kwargs?: Record<string, unknown>;
  response_metadata?: Record<string, unknown>;
  id: string;
}

export interface WorkflowExecutionContext {
  current_task_index: number;
  is_executing: boolean;
  execution_started_at: string | number | null;
}

export interface WorkflowTask {
  id: number;
  action: string;
  query: string | null;
  tool_name: string | null;
  tool_params: Record<string, unknown> | null;
  agent_id: string | null;
  agent_input: unknown | null;
  dependencies: number[];
}

export interface WorkflowPlan {
  query_type: string;
  response_strategy: string;
  direct_response: string | null;
  tasks: WorkflowTask[];
  execution_mode: string;
  parallel_groups: unknown | null;
  conversation_summary: string;
  reasoning: string;
  user_instructions: string;
  rewritten_query: string | null;
}

export interface EnhancementQueryAnalysis {
  enhanced_queries: string[];
  score_of_adequate_context: number;
}

export interface WorkflowTaskResult {
  task_id: number;
  action: string;
  success: boolean;
  started_at: number;
  completed_at: number;
  documents?: ConversationSource[] | null;
  tool_output?: unknown | null;
  subagent_output?: unknown | null;
  query_used?: string | null;
  enhancement_query_analysis?: EnhancementQueryAnalysis | null;
  tool_name?: string | null;
  tool_params?: Record<string, unknown> | null;
  tool_output_pruned_stats?: unknown | null;
  agent_id?: string | null;
  error?: string | null;
}

export interface WorkflowFinalAnswer {
  result: string;
  next_step_questions: string[];
  summary: string;
}

export interface WorkflowViolation {
  rule_type: string;
  rule_name: string;
  violation_message: string;
  severity: string;
  auto_block: boolean;
  metadata: Record<string, unknown>;
}

export interface WorkflowResults {
  final_answer: WorkflowFinalAnswer | null;
  task_results: WorkflowTaskResult[];
  validation_passed?: boolean;
  violations?: WorkflowViolation[];
  Violations?: WorkflowViolation[];
  risk_score?: number;
}

export interface WorkflowTraceState {
  messages: WorkflowTraceMessage[];
  session_id: string;
  original_query: string;
  start_time: number;
  cleaned_query: string | null;
  is_valid_query: boolean;
  plan: WorkflowPlan | null;
  execution_context: WorkflowExecutionContext | null;
  results: WorkflowResults;
  error: unknown | null;
}

export interface WorkflowTraceLastState {
  node_id: string;
  timestamp: number;
  timestamp_str: string;
}

export interface WorkflowTraceTimelineEvent {
  type: string;
  timestamp: number;
  timestamp_str: string;
  node_id?: string;
  node_type?: string;
  event_type?: string;
  data?: any;
  success?: boolean;
  duration?: number;
}

export interface WorkflowTraceEvent {
  event_type: string;
  timestamp: number;
  timestamp_str: string;
  data: any;
}

export interface WorkflowMetrics {
  // total_tokens: TokenUsage;
  nodes_executed: number;
  edges_evaluated: number;
  // events_logged: number;
  // failed_nodes: number;
  nodes_failed?: number;
  tasks_executed?: number;
  tasks_failed?: number;
}

export interface WorkflowTrace {
  workflow_id: string;
  workflow_name: string;
  success: boolean;
  error: string | null;
  duration: number;
  nodes: WorkflowTraceNode[];
  edges: WorkflowTraceEdge[];
  execution_path: string[];
  timeline: WorkflowTraceTimelineEvent[];
  events: WorkflowTraceEvent[];
  metrics: WorkflowMetrics;
  started_at?: number;
  started_at_str?: string;
  completed_at?: number;
  completed_at_str?: string;
  state?: WorkflowTraceState;
  last_state?: WorkflowTraceLastState;
}

export interface ConversationSession {
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

export interface ConversationSessionSummary {
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

export interface IConversationConfigPayload {
  widget_id: string;
  project_key: string;
  application_domain: string;
}

export interface IConversationInitiatePayload {
  widget_id: string;
  project_key: string;
  session_id?: string;
}

export interface IConversationInitiateResponse {
  session_id: string;
  token: string;
  websocket_url: string;
  expires_at: string;
  is_success: boolean;
  detail: string;
}

export interface IConversationListPayload {
  agent_id: string;
  project_key: string;
  limit: number;
  offset: number;
}

export interface IConversationListResponse {
  sessions: ConversationSessionSummary[];
  total_count: 0;
}

export interface IConversationByIdPayload {
  widget_id: string;
  session_id: string;
  agent_id: string;
  limit: number;
  offset: number;
  project_key: string;
}

export interface IConversationByIdResponse {
  sessions: ConversationSession[];
  total_count: number;
}

export interface ConversationDetails {
  _id?: string;
  Response?: string;
  Query?: string;
  QueryTimestamp: string | number | Date;
  ResponseTimestamp: string | number | Date;
  QueryId?: string;
  Sources: string[];
  Summary: string;
}

export interface Conversation {
  sessionId: string;
  lastMessage: string;
  createDate: string;
  lastUpdated: string;
  widget_id: string;
  agentId: string;
  playground: boolean;
}

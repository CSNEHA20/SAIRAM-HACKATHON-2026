/**
 * DataFlow AI — Frozen SSE Event Contract & Types
 * Reference: 18_IntegrationPlan.md §1 & 08_APIArchitecture.md §2
 */

export interface SSETokenEvent {
  type: 'token';
  content: string;
}

export interface SSESQLEvent {
  type: 'sql';
  content: string;
}

export interface SSEChartEvent {
  type: 'chart';
  chart_type: 'bar' | 'line' | 'pie' | 'scatter';
  title: string;
  data: Record<string, any>[];
  config: {
    x_key: string;
    y_key: string;
    x_label?: string;
    y_label?: string;
    color?: string;
  };
}

export interface SSEDiagramEvent {
  type: 'diagram';
  diagram_type: 'er' | 'flowchart' | 'sequence';
  title?: string;
  mermaid: string;
}

export interface SSEToolStartEvent {
  type: 'tool_start';
  tool: string;
}

export interface SSEToolEndEvent {
  type: 'tool_end';
  tool: string;
  success: boolean;
}

export interface SSEDoneEvent {
  type: 'done';
  message_id: string;
}

export interface SSEErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export type SSEEvent =
  | SSETokenEvent
  | SSESQLEvent
  | SSEChartEvent
  | SSEDiagramEvent
  | SSEToolStartEvent
  | SSEToolEndEvent
  | SSEDoneEvent
  | SSEErrorEvent;

export interface IMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sql_used?: string[];
  charts?: SSEChartEvent[];
  diagrams?: SSEDiagramEvent[];
  isStreaming?: boolean;
  activeTool?: string | null;
  error?: string;
}

export interface ChatState {
  messages: IMessage[];
  status: 'idle' | 'connecting' | 'streaming' | 'done' | 'error';
  activeTool: string | null;
  sessionId: string;
}

export interface SchemaColumn {
  name: string;
  type: string;
  pk: boolean;
  nullable: boolean;
}

export interface SchemaForeignKey {
  from?: string;
  table?: string;
  to?: string;
  from_column?: string;
  target_table?: string;
  target_column?: string;
}

export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
  foreign_keys: SchemaForeignKey[];
  row_count: number;
}


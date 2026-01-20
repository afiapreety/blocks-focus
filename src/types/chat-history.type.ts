export interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
  isActive?: boolean;
}

export interface ChatHistoryGroup {
  label: string;
  items: ChatHistoryItem[];
}

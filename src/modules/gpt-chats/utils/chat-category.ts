export interface ChatHistory {
  id: string;
  lastEntryDate: string;
  title: string;
}

export interface CategorizedChatHistories {
  today: ChatHistory[];
  yesterday: ChatHistory[];
  previous7Days: ChatHistory[];
  previous30Days: ChatHistory[];
  older: ChatHistory[];
}

export const categorizeChatsByDate = (chatList: ChatHistory[]): CategorizedChatHistories => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const categorized: CategorizedChatHistories = {
    today: [],
    yesterday: [],
    previous7Days: [],
    previous30Days: [],
    older: [],
  };

  const sorted = [...chatList].sort(
    (a, b) => new Date(b.lastEntryDate).getTime() - new Date(a.lastEntryDate).getTime()
  );

  sorted.forEach((chat) => {
    const chatDate = new Date(chat.lastEntryDate);
    const chatDateOnly = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());

    if (chatDateOnly.getTime() === today.getTime()) {
      categorized.today.push(chat);
    } else if (chatDateOnly.getTime() === yesterday.getTime()) {
      categorized.yesterday.push(chat);
    } else if (chatDate >= sevenDaysAgo) {
      categorized.previous7Days.push(chat);
    } else if (chatDate >= thirtyDaysAgo) {
      categorized.previous30Days.push(chat);
    } else {
      categorized.older.push(chat);
    }
  });

  return categorized;
};

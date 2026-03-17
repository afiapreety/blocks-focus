const unwrapMarkdownCodeFence = (text: string): string => {
  // Check if the text is wrapped in a markdown code fence
  const markdownFenceRegex = /^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/;
  const match = text.trim().match(markdownFenceRegex);

  if (match && match[1]) {
    return match[1];
  }
  return text;
};

export const parseChatMessage = (response: string) => {
  try {
    const parse = JSON.parse(response);
    if (typeof parse === 'object' && parse !== null) {
      const message = parse['result'] || '';
      const unwrappedMessage =
        typeof message === 'string' ? unwrapMarkdownCodeFence(message) : message;
      return {
        message: unwrappedMessage,
        suggestions: parse['next_step_questions'] || [],
      };
    }
    return { message: String(parse), suggestions: [] };
  } catch {
    return { message: unwrapMarkdownCodeFence(response), suggestions: [] };
  }
};

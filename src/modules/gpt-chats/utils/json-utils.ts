export const parseChatMessage = (response: string) => {
  // if (typeof response !== "string") return { message: "", suggestions: [] };
  try {
    const parse = JSON.parse(response);
    if (typeof parse === 'object' && parse !== null) {
      return {
        message: parse['result'] || '',
        suggestions: parse['next_step_questions'] || [],
      };
    }
    return { message: String(parse), suggestions: [] };
  } catch {
    return { message: response, suggestions: [] };
  }
};

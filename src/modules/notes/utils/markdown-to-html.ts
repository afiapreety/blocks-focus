/**
 * Markdown to HTML converter for Quill editor
 * Follows the same patterns used in MarkdownRenderer
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Handle code blocks first (preserve them)
  const codeBlocks: string[] = [];
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```/g, '').trim();
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
    return placeholder;
  });

  // Headers (must be at line start)
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Bold and italic (order matters)
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Inline code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Handle lists - group consecutive list items
  // Unordered lists (- or *)
  html = html.replace(/^[-*] (.+?)(?=\n[-*] |\n\n|$)/gm, (match) => {
    const items = match
      .split('\n')
      .map((line) => {
        const content = line.replace(/^[-*] /, '');
        return `<li>${content}</li>`;
      })
      .join('');
    return `__UL_START__${items}__UL_END__`;
  });

  // Ordered lists
  html = html.replace(/^\d+\. (.+?)(?=\n\d+\. |\n\n|$)/gm, (match) => {
    const items = match
      .split('\n')
      .map((line) => {
        const content = line.replace(/^\d+\. /, '');
        return `<li>${content}</li>`;
      })
      .join('');
    return `__OL_START__${items}__OL_END__`;
  });

  // Replace list placeholders with proper tags
  html = html.replace(/__UL_START__(.*?)__UL_END__/g, '<ul>$1</ul>');
  html = html.replace(/__OL_START__(.*?)__OL_END__/g, '<ol>$1</ol>');

  // Blockquotes
  html = html.replace(/^&gt; (.*?)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');
  html = html.replace(/^___$/gm, '<hr>');

  // Paragraphs - wrap non-empty lines not in tags
  const paragraphs = html.split('\n\n').map((para) => {
    // Skip if already wrapped in tags
    if (para.match(/^<[a-z]/i)) {
      return para;
    }
    // Skip code block placeholders
    if (para.includes('__CODE_BLOCK_')) {
      return para;
    }
    // Wrap plain text in <p>
    if (para.trim()) {
      return `<p>${para.trim()}</p>`;
    }
    return '';
  });

  html = paragraphs.filter(Boolean).join('');

  // Restore code blocks
  codeBlocks.forEach((block, index) => {
    html = html.replace(`<p>__CODE_BLOCK_${index}__</p>`, block);
  });

  return html;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

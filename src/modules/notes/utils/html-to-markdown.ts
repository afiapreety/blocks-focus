/**
 * Convert HTML content to Markdown format
 * Enhanced for TipTap editor with support for tables, task lists, callouts, and more
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  let markdown = html;

  // Convert TipTap callouts to markdown blockquotes with emoji indicators
  markdown = markdown.replace(
    /<div[^>]*data-type="(\w+)"[^>]*data-callout[^>]*>.*?<div[^>]*class="callout-content"[^>]*>(.*?)<\/div>\s*<\/div>/gis,
    (match, type, content) => {
      const emoji =
        type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'danger' ? '❌' : 'ℹ️';
      const cleanContent = content.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1').trim();
      return `> ${emoji} **${type.toUpperCase()}**: ${cleanContent}\n\n`;
    }
  );

  // Convert TipTap tables to markdown tables
  markdown = markdown.replace(
    /<table[^>]*>\s*<tbody[^>]*>(.*?)<\/tbody>\s*<\/table>/gis,
    (match, tbody) => {
      const rows = tbody.match(/<tr[^>]*>.*?<\/tr>/gis) || [];
      if (rows.length === 0) return '';

      const tableRows = rows.map((row: string) => {
        const cells = row.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gis) || [];
        const cellContents = cells.map((cell: string) => {
          return cell
            .replace(/<t[hd][^>]*>(.*?)<\/t[hd]>/i, '$1')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1')
            .trim();
        });
        return '| ' + cellContents.join(' | ') + ' |';
      });

      // Add separator after first row (header)
      if (tableRows.length > 0) {
        const headerCells = tableRows[0].split('|').filter(Boolean);
        const separator = '| ' + headerCells.map(() => '---').join(' | ') + ' |';
        tableRows.splice(1, 0, separator);
      }

      return tableRows.join('\n') + '\n\n';
    }
  );

  // Convert TipTap task lists (checkboxes)
  markdown = markdown.replace(
    /<ul[^>]*data-type="taskList"[^>]*>(.*?)<\/ul>/gis,
    (match, content) => {
      const items = content.match(/<li[^>]*data-type="taskItem"[^>]*>(.*?)<\/li>/gis) || [];
      return (
        items
          .map((item: string) => {
            const isChecked = /data-checked="true"/i.test(item);
            const text = item
              .replace(/<li[^>]*>(.*?)<\/li>/i, '$1')
              .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1')
              .trim();
            return `- [${isChecked ? 'x' : ' '}] ${text}`;
          })
          .join('\n') + '\n\n'
      );
    }
  );

  // Convert headings (h1-h6)
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // Convert horizontal rules
  markdown = markdown.replace(/<hr[^>]*>/gi, '\n---\n\n');

  // Convert paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // Convert line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  // Convert strikethrough (del/s tags)
  markdown = markdown.replace(/<(del|s)[^>]*>(.*?)<\/\1>/gi, '~~$2~~');

  // Convert underline (u tags) - markdown doesn't have native underline, use HTML
  markdown = markdown.replace(/<u[^>]*>(.*?)<\/u>/gi, '<u>$1</u>');

  // Convert bold
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

  // Convert italic
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Convert unordered lists (regular, not task lists) - handle nested lists
  markdown = convertNestedList(markdown, 'ul', '-');

  // Convert ordered lists - handle nested lists
  markdown = convertNestedList(markdown, 'ol', '1.');

  // Convert links
  markdown = markdown.replace(/<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Convert images
  markdown = markdown.replace(
    /<img[^>]*src=["'](.*?)["'][^>]*alt=["'](.*?)["'][^>]*>/gi,
    '![$2]($1)'
  );
  markdown = markdown.replace(
    /<img[^>]*alt=["'](.*?)["'][^>]*src=["'](.*?)["'][^>]*>/gi,
    '![$1]($2)'
  );
  markdown = markdown.replace(/<img[^>]*src=["'](.*?)["'][^>]*>/gi, '![]($1)');

  // Convert code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n');
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Convert blockquotes (regular, not callouts)
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
    const cleanContent = content.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1').trim();
    const lines = cleanContent.split('\n');
    return lines.map((line: string) => `> ${line.trim()}`).join('\n') + '\n\n';
  });

  // Remove any remaining HTML tags (except underline which markdown doesn't support)
  markdown = markdown.replace(/<(?!\/?(u)\b)[^>]*>/g, '');

  // Decode HTML entities
  markdown = markdown.replace(/&nbsp;/g, ' ');
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  markdown = markdown.replace(/&quot;/g, '"');
  markdown = markdown.replace(/&#39;/g, "'");

  // Clean up extra whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.trim();

  return markdown;
}

/**
 * Convert nested HTML lists to markdown with proper indentation
 */
function convertNestedList(html: string, listTag: string, marker: string): string {
  const listRegex = new RegExp(
    `<${listTag}(?![^>]*data-type)[^>]*>([\\s\\S]*?)<\\/${listTag}>`,
    'gi'
  );

  return html.replace(listRegex, (match) => {
    return processListLevel(match, listTag, marker, 0);
  });
}

/**
 * Recursively process list items at each nesting level
 */
function processListLevel(html: string, listTag: string, marker: string, depth: number): string {
  // Remove outer list tags
  const listContent = html
    .replace(new RegExp(`^<${listTag}[^>]*>`, 'i'), '')
    .replace(new RegExp(`<\\/${listTag}>$`, 'i'), '');

  let result = '';
  const indent = '  '.repeat(depth); // 2 spaces per level

  // Split by <li> tags while preserving nested lists
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  let itemNumber = 1;

  while ((match = liRegex.exec(listContent)) !== null) {
    const itemContent = match[1];

    // Check if this item contains a nested list
    const nestedListRegex = new RegExp(`<${listTag}[^>]*>[\\s\\S]*?<\\/${listTag}>`, 'i');
    const nestedMatch = itemContent.match(nestedListRegex);

    if (nestedMatch) {
      // Extract text before nested list
      const textBeforeNested = itemContent.substring(0, itemContent.indexOf(nestedMatch[0]));
      const cleanText = textBeforeNested.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1').trim();

      // Add current item
      const currentMarker = marker === '1.' ? `${itemNumber}.` : marker;
      result += `${indent}${currentMarker} ${cleanText}\n`;

      // Process nested list
      const nestedMarkdown = processListLevel(nestedMatch[0], listTag, marker, depth + 1);
      result += nestedMarkdown;

      itemNumber++;
    } else {
      // No nested list, just process the text
      const cleanText = itemContent.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1').trim();

      const currentMarker = marker === '1.' ? `${itemNumber}.` : marker;
      result += `${indent}${currentMarker} ${cleanText}\n`;

      itemNumber++;
    }
  }

  return result + (depth === 0 ? '\n' : '');
}

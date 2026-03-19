/**
 * Markdown to HTML converter for TipTap editor
 * Enhanced with support for tables, task lists, callouts, and more
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Handle code blocks first (preserve them)
  const codeBlocks: string[] = [];
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```/g, '').trim();
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
    return placeholder;
  });

  // Handle callout-style blockquotes EARLY with placeholders (before regular blockquotes)
  const callouts: string[] = [];
  html = html.replace(
    /^> (ℹ️|✅|⚠️|❌) \*\*([A-Z]+)\*\*: (.*)$/gm,
    (match, emoji, type, content) => {
      const calloutType = type.toLowerCase();
      const getIconSVG = (calloutTypeStr: string) => {
        switch (calloutTypeStr) {
          case 'success':
            return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg>';
          case 'warning':
            return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
          case 'danger':
            return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
          default: // info
            return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>';
        }
      };
      const placeholder = `XXXXXCALLOUTPLACEHOLDER${callouts.length}XXXXX`;
      callouts.push(
        `<div data-callout="" data-type="${calloutType}" class="callout callout-${calloutType}"><div class="callout-icon">${getIconSVG(calloutType)}</div><div class="callout-content"><p>${content}</p></div></div>`
      );
      return placeholder;
    }
  );

  // Handle markdown tables
  html = html.replace(
    /^\|(.+)\|\s*\n\|([\s\-:|]+)\|\s*\n((\|.+\|\s*\n?)+)/gm,
    (match, header, separator, body) => {
      const headerCells = header
        .split('|')
        .filter(Boolean)
        .map((cell: string) => cell.trim());
      const bodyRows = body.trim().split('\n');

      const headerRow =
        '<tr>' + headerCells.map((cell: string) => `<th><p>${cell}</p></th>`).join('') + '</tr>';
      const bodyRowsHtml = bodyRows
        .map((row: string) => {
          const cells = row
            .split('|')
            .filter(Boolean)
            .map((cell: string) => cell.trim());
          return '<tr>' + cells.map((cell: string) => `<td><p>${cell}</p></td>`).join('') + '</tr>';
        })
        .join('');

      return `<table class="tiptap-table"><tbody>${headerRow}${bodyRowsHtml}</tbody></table>`;
    }
  );

  // Headers (must be at line start)
  html = html.replace(/^###### (.*?)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.*?)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Handle lists BEFORE inline formatting to avoid breaking list detection
  // Process lists with support for nested/indented items

  // Task lists (checkboxes) - must come before regular lists
  html = html.replace(/^( *)([-*] \[[ xX]\] .+)$/gm, (match, indent, content) => {
    const isChecked = /\[x\]/i.test(content);
    const text = content.replace(/^[-*] \[[ xX]\] /, '').trim();
    const level = indent.length / 2; // 2 spaces = 1 level
    return `__TASK_ITEM_${level}__${isChecked}__${text}__TASK_ITEM_END__`;
  });

  // Unordered lists (- or *) with indentation support
  html = html.replace(/^( *)([-*] .+)$/gm, (match, indent, content) => {
    const text = content.replace(/^[-*] /, '').trim();
    const level = indent.length / 2; // 2 spaces = 1 level
    return `__UL_ITEM_${level}__${text}__UL_ITEM_END__`;
  });

  // Ordered lists with indentation support
  html = html.replace(/^( *)(\d+\. .+)$/gm, (match, indent, content) => {
    const text = content.replace(/^\d+\. /, '').trim();
    const level = indent.length / 2; // 2 spaces = 1 level
    return `__OL_ITEM_${level}__${text}__OL_ITEM_END__`;
  });

  // Build nested task lists
  html = buildNestedList(
    html,
    'TASK_ITEM',
    (isChecked, text) => `<li data-type="taskItem" data-checked="${isChecked}"><p>${text}</p></li>`,
    '<ul data-type="taskList">',
    '</ul>'
  );

  // Build nested unordered lists
  html = buildNestedList(html, 'UL_ITEM', (text) => `<li><p>${text}</p></li>`, '<ul>', '</ul>');

  // Build nested ordered lists
  html = buildNestedList(html, 'OL_ITEM', (text) => `<li><p>${text}</p></li>`, '<ol>', '</ol>');

  // NOW apply inline formatting (bold, italic, etc.) - after lists are wrapped
  // Bold and italic (order matters)
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~(.*?)~~/g, '<s>$1</s>');

  // Underline (HTML tags in markdown)
  html = html.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');

  // Inline code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

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
    // Skip code block and list placeholders
    if (
      para.includes('__CODE_BLOCK_') ||
      para.includes('__TASK_LIST_START__') ||
      para.includes('__UL_START__') ||
      para.includes('__OL_START__')
    ) {
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
    html = html.replace(`__CODE_BLOCK_${index}__`, block);
  });

  // Restore callouts
  callouts.forEach((callout, index) => {
    html = html.replace(new RegExp(`<p>XXXXXCALLOUTPLACEHOLDER${index}XXXXX</p>`, 'g'), callout);
    html = html.replace(new RegExp(`XXXXXCALLOUTPLACEHOLDER${index}XXXXX`, 'g'), callout);
  });

  return html;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Build nested HTML lists from marked-up items with level indicators
 */
function buildNestedList(
  html: string,
  itemType: string,
  itemRenderer: (...args: any[]) => string,
  openTag: string,
  closeTag: string
): string {
  const itemRegex = new RegExp(`__${itemType}_(\\d+)__(.+?)__${itemType}_END__`, 'g');

  // Find all consecutive groups of list items
  const lines = html.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(itemRegex);

    if (match) {
      // Found start of a list - collect all consecutive list items
      const listItems: Array<{ level: number; content: string[] }> = [];

      while (i < lines.length) {
        const currentLine = lines[i];
        const itemMatch = new RegExp(`__${itemType}_(\\d+)__(.+?)__${itemType}_END__`).exec(
          currentLine
        );

        if (!itemMatch) break;

        const level = parseInt(itemMatch[1]);
        const content = itemMatch[2].split('__');
        listItems.push({ level, content });
        i++;
      }

      // Build nested structure using stack
      let listHtml = '';
      let prevLevel = -1;
      const openTags: number[] = [];

      for (let j = 0; j < listItems.length; j++) {
        const { level, content } = listItems[j];
        const nextLevel = j < listItems.length - 1 ? listItems[j + 1].level : -1;

        // Close deeper lists when returning to shallower level
        while (openTags.length > 0 && openTags[openTags.length - 1] > level) {
          openTags.pop();
          listHtml += `</li>${closeTag}`;
        }

        // Close previous item at same level
        if (prevLevel === level && openTags.length > 0) {
          listHtml += '</li>';
        }

        // Open new list when starting or going deeper
        if (openTags.length === 0 || openTags[openTags.length - 1] < level) {
          listHtml += openTag;
          openTags.push(level);
        }

        // Add item content without closing tag
        const itemHtml = itemRenderer(...content);
        listHtml += itemHtml.replace('</li>', '');

        // Close item if next is not deeper
        if (nextLevel === -1 || nextLevel <= level) {
          listHtml += '</li>';
        }

        prevLevel = level;
      }

      // Close all remaining open lists
      while (openTags.length > 0) {
        openTags.pop();
        listHtml += closeTag;
      }

      result.push(listHtml);
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join('\n');
}

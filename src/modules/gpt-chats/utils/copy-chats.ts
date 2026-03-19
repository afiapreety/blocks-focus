type CopyChatOptions = {
  setCopiedId: (id: number | null) => void;
  conversations?: Array<{ message: string; type: string }>;
};

export const handleCopyRaw = async (
  content: string,
  messageId: number,
  options: CopyChatOptions
) => {
  const { setCopiedId } = options;
  try {
    await navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  } catch (err) {
    console.error('Failed to copy raw text:', err);
  }
};

export const handleCopyWithStyling = async (messageId: number, options: CopyChatOptions) => {
  const { setCopiedId, conversations } = options;
  try {
    const messageElement = document.querySelector(
      `[data-message-id="${messageId}"] .prose`
    ) as HTMLElement;

    if (!messageElement) {
      console.error('Message element not found for ID:', messageId);
      return;
    }

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    const clonedElement = messageElement.cloneNode(true) as HTMLElement;
    tempContainer.appendChild(clonedElement);

    const allElements = clonedElement.querySelectorAll('*');

    const originalElements = messageElement.querySelectorAll('*');
    allElements.forEach((element, index) => {
      const originalElement = originalElements[index] as HTMLElement;
      if (originalElement) {
        const computedStyle = window.getComputedStyle(originalElement);
        const inlineStyle: string[] = [];

        const stylesToCopy = [
          'color',
          'background-color',
          'font-family',
          'font-size',
          'font-weight',
          'font-style',
          'text-decoration',
          'text-align',
          'line-height',
          'margin-top',
          'margin-bottom',
          'margin-left',
          'margin-right',
          'padding-top',
          'padding-bottom',
          'padding-left',
          'padding-right',
          'border',
          'border-radius',
          'list-style-type',
          'display',
        ];

        stylesToCopy.forEach((prop) => {
          const value = computedStyle.getPropertyValue(prop);
          if (value && value !== 'none' && value !== 'normal' && value !== 'auto') {
            inlineStyle.push(`${prop}: ${value}`);
          }
        });

        if (inlineStyle.length > 0) {
          (element as HTMLElement).setAttribute('style', inlineStyle.join('; '));
        }
      }
    });

    const rootComputedStyle = window.getComputedStyle(messageElement);
    const rootInlineStyle: string[] = [];
    ['color', 'background-color', 'font-family', 'font-size', 'line-height'].forEach((prop) => {
      const value = rootComputedStyle.getPropertyValue(prop);
      if (value) {
        rootInlineStyle.push(`${prop}: ${value}`);
      }
    });
    clonedElement.setAttribute('style', rootInlineStyle.join('; '));

    const checkboxes = clonedElement.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      const isChecked = (checkbox as HTMLInputElement).checked;
      const symbol = document.createTextNode(isChecked ? '☑ ' : '☐ ');
      checkbox.parentNode?.replaceChild(symbol, checkbox);
    });

    // Add spacing after paragraphs that follow headings for better copy-paste formatting
    const headings = clonedElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading) => {
      const nextSibling = heading.nextElementSibling;
      if (nextSibling && nextSibling.tagName === 'P') {
        const spacer = document.createElement('br');
        if (nextSibling.nextSibling) {
          nextSibling.parentNode?.insertBefore(spacer, nextSibling.nextSibling);
        } else {
          nextSibling.parentNode?.appendChild(spacer);
        }
      }
    });

    const styledHtml = clonedElement.outerHTML;
    const textContent = messageElement.textContent || '';

    document.body.removeChild(tempContainer);

    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([styledHtml], { type: 'text/html' }),
      'text/plain': new Blob([textContent], { type: 'text/plain' }),
    });

    await navigator.clipboard.write([clipboardItem]);

    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  } catch (err) {
    console.error('Failed to copy with styling:', err);
    if (conversations && conversations[messageId]) {
      const message = conversations[messageId];
      await navigator.clipboard.writeText(message.message);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }
};

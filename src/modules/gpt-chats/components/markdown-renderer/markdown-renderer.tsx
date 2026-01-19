import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Editor, { loader, Monaco } from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { MarkdownComponentsMap } from './markdown-components-map';
import { useEffect, useState } from 'react';

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

const defineJsonTheme = (monaco: Monaco) => {
  monaco.editor.defineTheme('jsonCustomTheme', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '0451A5' },
      { token: 'string.value.json', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'keyword.json', foreground: '0000FF' },
      { token: 'delimiter', foreground: '000000' },
    ],
    colors: {
      'editor.background': '#F8F9FA',
      'editor.foreground': '#1F2937',
      'editor.lineHighlightBackground': '#F3F4F6',
      'editorLineNumber.foreground': '#9CA3AF',
      'editorLineNumber.activeForeground': '#4B5563',
      'editor.selectionBackground': '#E5E7EB',
      'editor.inactiveSelectionBackground': '#F3F4F6',
    },
  });

  monaco.editor.defineTheme('jsonCustomThemeDark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '9CDCFE' },
      { token: 'string.value.json', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'keyword.json', foreground: '569CD6' },
      { token: 'delimiter', foreground: 'D4D4D4' },
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editor.lineHighlightBackground': '#2D2D2D',
      'editorLineNumber.foreground': '#6B7280',
      'editorLineNumber.activeForeground': '#9CA3AF',
      'editor.selectionBackground': '#374151',
      'editor.inactiveSelectionBackground': '#2D2D2D',
    },
  });
};

const JsonMonacoBlock = ({ content }: { content: string }) => {
  const [isThemeReady, setIsThemeReady] = useState(false);

  const lineCount = content.split('\n').length;
  const height = Math.min(Math.max(lineCount * 20 + 16, 80), 400);

  useEffect(() => {
    loader.init().then((monaco) => {
      defineJsonTheme(monaco);
      setIsThemeReady(true);
    });
  }, []);

  if (!isThemeReady) {
    return (
      <div
        className="my-2 whitespace-pre-wrap break-words font-mono text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700"
        style={{ fontFamily: 'ui-monospace, monospace' }}
      >
        {content}
      </div>
    );
  }

  return (
    <div className="my-2 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <Editor
        height={`${height}px`}
        language="json"
        value={content}
        theme="jsonCustomTheme"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineNumbers: 'on',
          folding: false,
          foldingStrategy: 'indentation',
          wordWrap: 'on',
          automaticLayout: true,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          contextmenu: false,
          selectionHighlight: false,
          renderLineHighlight: 'none',
          lineDecorationsWidth: 8,
          lineNumbersMinChars: 3,
          padding: { top: 8, bottom: 8 },
          domReadOnly: true,
          cursorStyle: 'line',
          cursorBlinking: 'solid',
        }}
      />
    </div>
  );
};

const JsonSkeletonBlock = ({ content }: { content: string }) => {
  const lineCount = content.split('\n').length;
  const height = Math.min(Math.max(lineCount * 20 + 16, 80), 400);

  return (
    <div
      className="my-2 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-[#F8F9FA] dark:bg-[#1E1E1E] w-full"
      style={{ height: `${height}px` }}
    >
      <div className="flex h-full">
        <div
          className="flex-shrink-0 bg-[#F8F9FA] dark:bg-[#1E1E1E] text-gray-300 dark:text-gray-700 text-right select-none"
          style={{
            width: '48px',
            paddingTop: '8px',
            paddingRight: '8px',
            fontSize: '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            lineHeight: '20px',
          }}
        >
          {content.split('\n').map((_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>

        <div className="flex-1 relative overflow-hidden" style={{ padding: '8px' }}>
          <pre
            className="text-gray-300 dark:text-gray-600 whitespace-pre-wrap m-0 opacity-60"
            style={{
              fontSize: '13px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              lineHeight: '20px',
            }}
          >
            {content}
          </pre>

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite linear',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  const jsonBlockRegex = /:::(json|json-skeleton)\n([\s\S]*?)\n:::/g;
  const hasJsonBlock = jsonBlockRegex.test(content);

  if (hasJsonBlock) {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    jsonBlockRegex.lastIndex = 0;

    while ((match = jsonBlockRegex.exec(content)) !== null) {
      const blockType = match[1];
      const blockContent = match[2];

      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        if (textBefore.trim()) {
          parts.push(
            <ReactMarkdown
              key={`text-${lastIndex}`}
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponentsMap}
            >
              {textBefore}
            </ReactMarkdown>
          );
        }
      }

      if (blockType === 'json-skeleton') {
        parts.push(<JsonSkeletonBlock key={`skeleton-${match.index}`} content={blockContent} />);
      } else {
        parts.push(<JsonMonacoBlock key={`json-${match.index}`} content={blockContent} />);
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const textAfter = content.slice(lastIndex);
      if (textAfter.trim()) {
        parts.push(
          <ReactMarkdown
            key={`text-${lastIndex}`}
            remarkPlugins={[remarkGfm]}
            components={MarkdownComponentsMap}
          >
            {textAfter}
          </ReactMarkdown>
        );
      }
    }

    return (
      <div
        className={cn(
          'prose prose-sm max-w-none dark:prose-invert',
          'prose-headings:my-2 prose-headings:font-semibold',
          'prose-p:my-3 prose-p:leading-relaxed',
          'prose-ol:list-decimal prose-ul:list-disc',
          'prose-pre:bg-transparent prose-pre:p-0',
          className
        )}
      >
        {parts}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'prose prose-sm max-w-none dark:prose-invert',
        'prose-headings:my-2 prose-headings:font-semibold',
        'prose-p:my-3 prose-p:leading-relaxed',
        'prose-ol:list-decimal prose-ul:list-disc',
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponentsMap}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

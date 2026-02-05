import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { MarkdownComponentsMap } from './markdown-components-map';
import { ImageIcon, Download } from 'lucide-react';

type MarkdownRendererProps = {
  content: string;
  className?: string;
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

const ImageSkeletonBlock = () => {
  return (
    <div className="max-w-[512px] w-full rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-card ">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="w-10 sm:w-60"></div>
        <button
          disabled
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs bg-white border border-gray-300 opacity-50 cursor-not-allowed ml-2 flex-shrink-0"
          title="Download image"
        >
          <Download className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-400">Download</span>
        </button>
      </div>

      <div className="bg-white w-full">
        <div className="w-full h-[300px] sm:h-[400px] md:h-[512px] relative overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite linear',
            }}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <ImageIcon
                className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500"
                strokeWidth={1.5}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Generating image
              </span>
              <div className="flex items-center gap-1">
                <div
                  className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 "
                  // style={{ animationDelay: '0s', animationDuration: '1s' }}
                />
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 " />
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 " />
              </div>
            </div>
          </div>
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
  const jsonBlockRegex = /:::(json|json-skeleton|image-skeleton|image)\n([\s\S]*?)\n:::/g;
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

      if (blockType === 'image-skeleton') {
        parts.push(<ImageSkeletonBlock key={`image-skeleton-${match.index}`} />);
      } else {
        parts.push(<JsonSkeletonBlock key={`skeleton-${match.index}`} content={blockContent} />);
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
          'prose-headings:font-semibold',
          'prose-p:leading-relaxed prose-p:p-0 prose-p:m-0',
          'prose-ol:list-decimal prose-ul:list-disc prose-ul:p-0',
          'prose-li:p-0 prose-li:m-0',

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
        'prose max-w-none dark:prose-invert',
        'prose-headings:font-semibold',
        'prose-h1:mb-3',
        'prose-h2:my-3',
        'prose-p:leading-relaxed prose-p:p-0 prose-p:m-0',
        'prose-ol:list-decimal prose-ul:list-disc prose-ul:p-0',
        'prose-pre:p-0 prose-pre:m-0',
        'prose-li:p-0 prose-li:m-0',
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponentsMap}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

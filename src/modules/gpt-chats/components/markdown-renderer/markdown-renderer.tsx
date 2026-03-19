import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImageIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownComponentsMap } from './markdown-components-map';
import { Skeleton } from '@/components/ui-kit/skeleton';

type MarkdownRendererProps = {
  content: string;
  className?: string;
  isStreaming?: boolean;
};

const unwrapResultFromContent = (value: string) => {
  // First, try to unwrap JSON-stringified content
  let unwrapped = value;
  let attempts = 0;
  const maxAttempts = 3; // Prevent infinite loops

  // Keep unwrapping until we get a non-JSON string or hit max attempts
  while (attempts < maxAttempts) {
    try {
      const parsed = JSON.parse(unwrapped);

      // If parsed result is a string, it was stringified - unwrap it
      if (typeof parsed === 'string') {
        unwrapped = parsed;
        attempts++;
        continue;
      }

      // If it's an object with a 'result' property, extract it
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        const result = obj.result;

        if (typeof result === 'string' && result.trim()) {
          unwrapped = result;
          attempts++;
          continue;
        }
      }

      // If we get here, it's an object but not what we're looking for
      break;
    } catch {
      // Not JSON, we're done unwrapping
      break;
    }
  }

  return unwrapped;
};

const normalizeQuoteToBlockquote = (text: string): string => {
  const trimmed = text.trim();

  if (trimmed.startsWith('>')) {
    return text;
  }

  const quoteWithAuthorPatterns = [
    /^[""](.+?)[""][\s]*[-–—]\s*(.+)$/s,
    /^"(.+?)"[\s]*[-–—]\s*(.+)$/s,
    /^[''](.+?)[''][\s]*[-–—]\s*(.+)$/s,
    /^'(.+?)'[\s]*[-–—]\s*(.+)$/s,
    /^(.+?)[\s]*[-–—]\s*(.+)$/s,
  ];

  for (const pattern of quoteWithAuthorPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const quoteText = match[1].trim();
      const author = match[2].trim();

      if (author.length > 0 && author.length < 100 && !quoteText.includes('\n\n')) {
        return `> ${quoteText} – ${author}`;
      }
    }
  }

  const simpleQuotePattern = /^[""](.+?)[""]$/s;
  const simpleMatch = trimmed.match(simpleQuotePattern);
  if (simpleMatch) {
    return `> ${simpleMatch[1].trim()}`;
  }

  return text;
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
      <div className="flex items-center justify-between px-4 py-2 bg-card">
        <Skeleton className="h-4 w-32" />
        <div className="w-10 sm:w-60"></div>
        <button
          disabled
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs bg-card border opacity-50 cursor-not-allowed ml-2 flex-shrink-0"
          title="Download image"
        >
          <Download className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Download</span>
        </button>
      </div>

      <div className="bg-card w-full">
        <Skeleton className="w-full h-[300px] sm:h-[400px] md:h-[512px] rounded-none relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <ImageIcon
                className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/60"
                strokeWidth={1.5}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground/80">
                Generating image
              </span>
              <div className="flex items-center gap-1">
                <div
                  className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/60 animate-bounce"
                  style={{ animationDelay: '0s', animationDuration: '1.4s' }}
                />
                <div
                  className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/60 animate-bounce"
                  style={{ animationDelay: '0.2s', animationDuration: '1.4s' }}
                />
                <div
                  className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/60 animate-bounce"
                  style={{ animationDelay: '0.4s', animationDuration: '1.4s' }}
                />
              </div>
            </div>
          </div>
        </Skeleton>
      </div>
    </div>
  );
};

export const MarkdownRenderer = ({
  content,
  className = '',
  isStreaming = false,
}: MarkdownRendererProps) => {
  const unwrappedContent = unwrapResultFromContent(content);
  const quoteNormalized = isStreaming
    ? unwrappedContent
    : normalizeQuoteToBlockquote(unwrappedContent);

  // Check for special blocks first before any other processing
  // Handle both regular hyphens, en-dashes, and em-dashes in block names, with optional spaces
  const specialBlockRegex =
    /:::(json|json\s*[-–—]\s*skeleton|image\s*[-–—]\s*skeleton|image)(?:\n([\s\S]*?)\n:::|\s+(.*?)\s*:::)/g;
  const hasSpecialBlock = specialBlockRegex.test(quoteNormalized);

  // If we have special blocks, process them directly without going through markdown
  if (hasSpecialBlock) {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    specialBlockRegex.lastIndex = 0;

    while ((match = specialBlockRegex.exec(quoteNormalized)) !== null) {
      const blockType = match[1];
      const blockContent = match[2] || match[3] || '';

      if (match.index > lastIndex) {
        const textBefore = quoteNormalized.slice(lastIndex, match.index);
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

      // Normalize block type to handle spaces and dashes
      const normalizedBlockType = blockType.replace(/\s*[-–—]\s*/g, '-');

      if (normalizedBlockType === 'image-skeleton') {
        parts.push(<ImageSkeletonBlock key={`image-skeleton-${match.index}`} />);
      } else if (normalizedBlockType === 'image') {
        // Render the markdown image content inside the image block
        parts.push(
          <ReactMarkdown
            key={`image-${match.index}`}
            remarkPlugins={[remarkGfm]}
            components={MarkdownComponentsMap}
          >
            {blockContent}
          </ReactMarkdown>
        );
      } else {
        parts.push(<JsonSkeletonBlock key={`skeleton-${match.index}`} content={blockContent} />);
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < quoteNormalized.length) {
      const textAfter = quoteNormalized.slice(lastIndex);
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
          'prose prose-sm max-w-none min-w-0 dark:prose-invert',
          'prose-headings:font-semibold prose-headings:mb-2 prose-headings:mt-4',
          'prose-h1:mt-0 prose-h1:mb-3',
          'prose-h2:mt-4 prose-h2:mb-2',
          'prose-h3:mt-4 prose-h3:mb-2',
          'prose-h4:mt-3 prose-h4:mb-2',
          'prose-h5:mt-3 prose-h5:mb-2',
          'prose-h6:mt-3 prose-h6:mb-2',
          'prose-p:leading-relaxed prose-p:p-0 prose-p:m-0 prose-p:mb-3',
          'prose-ol:list-decimal prose-ul:list-disc prose-ul:p-0',
          'prose-pre:bg-transparent prose-pre:p-0',
          className
        )}
      >
        {parts}
      </div>
    );
  }

  // No special blocks found, render normal markdown
  return (
    <div
      className={cn(
        'prose max-w-none min-w-0 dark:prose-invert',
        'prose-headings:font-semibold prose-headings:mb-2 prose-headings:mt-4',
        'prose-h1:mt-0 prose-h1:mb-3',
        'prose-h2:mt-4 prose-h2:mb-2',
        'prose-h3:mt-4 prose-h3:mb-2',
        'prose-h4:mt-3 prose-h4:mb-2',
        'prose-h5:mt-3 prose-h5:mb-2',
        'prose-h6:mt-3 prose-h6:mb-2',
        'prose-p:leading-relaxed prose-p:p-0 prose-p:m-0 prose-p:mb-3',
        'prose-ol:list-decimal prose-ul:list-disc prose-ul:p-0',
        'prose-pre:p-0 prose-pre:m-0',
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponentsMap}>
        {quoteNormalized}
      </ReactMarkdown>
    </div>
  );
};

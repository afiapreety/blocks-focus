import React, { useState } from 'react';
import { Check, Clipboard, Download } from 'lucide-react';
import type { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import dark from 'react-syntax-highlighter/dist/esm/styles/prism/atom-dark';

type SyntaxHighlighterTheme = Record<string, React.CSSProperties>;

const prismDarkTheme = dark as unknown as SyntaxHighlighterTheme;

type MarkdownCodeProps = React.ComponentPropsWithoutRef<'code'> & {
  inline?: boolean;
  node?: unknown;
};

const MarkdownCode = ({
  inline,
  className,
  children,
  style: codeStyle,
  ...props
}: MarkdownCodeProps) => {
  const match = /language-(\w+)/.exec(className || '');
  const code = String(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    const language = match[1];
    return (
      <div className="max-w-full overflow-auto rounded-md bg-gray-900">
        <div className="flex w-full items-center justify-between bg-gray-700 p-2.5 text-xs text-gray-300">
          <span className="text-sm uppercase">{language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-gray-600 "
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Clipboard className="h-4 w-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <SyntaxHighlighter
          showLineNumbers
          style={prismDarkTheme}
          customStyle={{
            margin: 0,
            scrollbarColor: '#424242 transparent',
            scrollMargin: '0',
            ...(codeStyle || {}),
          }}
          language={language}
          PreTag="div"
          {...props}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  }

  return <code {...props}>{children}</code>;
};

const MarkdownImage: Components['img'] = ({ src, alt, ...props }) => {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    if (!src) return;

    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const filename = alt || 'image';
      link.download = `${filename}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };
  return (
    <div className="max-w-lg rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-card ">
        <span className="text-sm text-high-emphasis font-medium truncate">{alt || 'Image'}</span>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs bg-white hover:cursor-pointer border border-gray-300  ml-2 flex-shrink-0"
          title="Download image"
        >
          {downloaded ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-600" />
              <span className="text-high-emphasis">Downloaded</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5 text-high-emphasis" />
              <span className="text-high-emphasis">Download</span>
            </>
          )}
        </button>
      </div>
      <div className="bg-white">
        <img
          loading="lazy"
          alt={alt}
          src={src}
          className="h-auto max-w-[512px] w-full my-0 object-contain"
          {...props}
        />
      </div>
    </div>
  );
};

export const MarkdownComponentsMap: Partial<Components> = {
  p: (props) => {
    const isElementWithSrc = (
      child: React.ReactNode
    ): child is React.ReactElement<{ src?: string }> =>
      React.isValidElement(child) &&
      typeof (child as React.ReactElement<{ src?: unknown }>).props?.src === 'string';

    const hasImage = React.Children.toArray(props.children).some((child) =>
      isElementWithSrc(child)
    );
    if (hasImage) {
      return (
        <div className="whitespace-pre-wrap break-words leading-relaxed">{props.children}</div>
      );
    }
    return <p className="whitespace-pre-wrap break-words leading-relaxed">{props.children}</p>;
  },

  a: (props) => (
    <a className="text-primary" target="_blank" {...props}>
      {props.children}
    </a>
  ),

  strong: (props) => <strong>{props.children}</strong>,
  em: (props) => <em>{props.children}</em>,
  del: (props) => <del>{props.children}</del>,

  ul: (props) => <ul className="list-disc list-outside">{props.children}</ul>,
  ol: (props) => <ol className="list-decimal list-outside">{props.children}</ol>,
  li: (props) => (
    <li className="break-words pl-2 [&>*]:inline-block [&>*:first-child]:inline !mb-1">
      {props.children}
    </li>
  ),

  table: (props) => (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse border-[1.5px] !border-border !mb-0 !mt-1.5">
        {props.children}
      </table>
    </div>
  ),

  th: (props) => (
    <th className="min-w-[150px] max-w-[350px] break-all border p-2">{props.children}</th>
  ),
  td: (props) => (
    <td className="min-w-[150px] max-w-[350px] break-words border p-2">{props.children}</td>
  ),

  blockquote: (props) => (
    <blockquote className="whitespace-pre-wrap break-words border-l-4 border-border pl-4 text-foreground/90 [&>p]:m-0 [&>p+p]:mt-3">
      {props.children}
    </blockquote>
  ),

  code: MarkdownCode as Components['code'],

  pre: (props) => <pre className="overflow-x-auto whitespace-pre-wrap p-0">{props.children}</pre>,

  img: MarkdownImage,
};

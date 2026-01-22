// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */
/* eslint-disable @next/next/no-img-element, react/display-name */
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import dark from 'react-syntax-highlighter/dist/esm/styles/prism/atom-dark';
import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils';

export const MarkdownComponentsMap: Partial<Components> = {
  p: (props) => <p className="whitespace-pre-wrap break-words leading-relaxed">{props.children}</p>,

  a: (props) => (
    <a className="text-primary" target="_blank" {...props}>
      {props.children}
    </a>
  ),

  strong: (props) => <strong>{props.children}</strong>,
  em: (props) => <em>{props.children}</em>,
  del: (props) => <del>{props.children}</del>,

  ul: (props) => (
    <ul className="my-1 ml-4 flex list-inside list-disc flex-col">{props.children}</ul>
  ),
  ol: (props) => (
    <ol className="my-1 ml-4 flex list-inside list-decimal flex-col">{props.children}</ol>
  ),
  li: (props) => <li className="whitespace-pre-wrap break-words">{props.children}</li>,

  table: (props) => (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse border">{props.children}</table>
    </div>
  ),

  th: (props) => (
    <th className="min-w-[150px] max-w-[350px] break-all border p-2">{props.children}</th>
  ),
  td: (props) => (
    <td className="min-w-[150px] max-w-[350px] break-words border p-2">{props.children}</td>
  ),

  blockquote: (props) => (
    <blockquote className="my-2 whitespace-pre-wrap break-words border-l-2 border-gray-300 pl-4 italic text-gray-600">
      {props.children}
    </blockquote>
  ),

  code: ({ inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');

    if (!inline && match) {
      const language = match[1];
      return (
        <div className="max-w-full overflow-auto rounded-md bg-gray-900">
          <div className="flex w-full items-center justify-between bg-gray-700 p-2.5 text-xs text-gray-300">
            <span className="text-sm uppercase">{language}</span>
          </div>
          <SyntaxHighlighter
            showLineNumbers
            style={dark}
            customStyle={{
              margin: 0,
              scrollbarColor: '#424242 transparent',
              scrollMargin: '0',
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
  },

  pre: (props) => <pre className="overflow-x-auto whitespace-pre-wrap p-0">{props.children}</pre>,

  img: (props) => <img loading="lazy" alt={props.alt} className="h-auto max-w-full" {...props} />,
};

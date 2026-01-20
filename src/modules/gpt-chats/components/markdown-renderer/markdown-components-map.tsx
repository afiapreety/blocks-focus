// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */
/* eslint-disable @next/next/no-img-element, react/display-name */

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import dark from 'react-syntax-highlighter/dist/esm/styles/prism/atom-dark';
import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils';

export const MarkdownComponentsMap: Partial<Components> = {
  p: (props) => (
    <p className="my-1 whitespace-pre-wrap break-words leading-relaxed">{props.children}</p>
  ),

  a: (props) => (
    <a className="text-primary" target="_blank" {...props}>
      {props.children}
    </a>
  ),

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
};

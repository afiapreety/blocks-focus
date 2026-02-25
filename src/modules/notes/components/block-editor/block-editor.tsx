import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { SlashCommand } from './slash-command';
import { EditorBubbleMenu } from './editor-bubble-menu';
import { TableBubbleMenu } from './table-bubble-menu';
import { CalloutBubbleMenu } from './callout-bubble-menu';
import { Callout } from './extensions/callout';
import { cn } from '@/lib/utils';
import './block-editor.css';
import 'tippy.js/dist/tippy.css';

interface BlockEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  onEditorReady?: () => void;
  readOnly?: boolean;
}

export function BlockEditor({
  value,
  onChange,
  placeholder = 'Write anything. Enter "/" for commands',
  className,
  onEditorReady,
  readOnly = false,
}: BlockEditorProps) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
          horizontalRule: false,
        }),
        Placeholder.configure({
          placeholder,
          showOnlyWhenEditable: true,
          showOnlyCurrent: true,
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          autolink: false,
          HTMLAttributes: {
            class: 'text-primary underline cursor-pointer',
          },
        }),
        HorizontalRule,
        Table.configure({
          resizable: true,
          HTMLAttributes: {
            class: 'tiptap-table',
          },
        }),
        TableRow,
        TableHeader,
        TableCell,
        Image.configure({
          inline: true,
          allowBase64: true,
          HTMLAttributes: {
            class: 'tiptap-image',
          },
        }),
        Callout,
        SlashCommand,
      ],
      content: value,
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();

        // Debounce onChange to capture chunks instead of every keystroke
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          if (html !== lastContentRef.current) {
            lastContentRef.current = html;
            onChange(html);
          }
        }, 500); // 500ms delay creates chunk-wise history
      },
      editorProps: {
        attributes: {
          class: 'focus:outline-none',
        },
      },
    },
    []
  );

  useEffect(() => {
    if (editor && value) {
      const currentContent = editor.getHTML();
      // Only update if content is different (avoid unnecessary updates)
      if (value !== currentContent) {
        editor.commands.setContent(value, { emitUpdate: false });
      }
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady();
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('block-editor-wrapper', className)}>
      {!readOnly && (
        <>
          <CalloutBubbleMenu editor={editor} />
          <TableBubbleMenu editor={editor} />
          <EditorBubbleMenu editor={editor} />
        </>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

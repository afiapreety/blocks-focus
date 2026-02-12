import { useEffect, useRef, useCallback, useState } from 'react';
import Quill from 'quill';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import 'quill/dist/quill.snow.css';

interface NotesEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

interface ToolbarPosition {
  top: number;
  left: number;
}

export function NotesEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  className,
}: NotesEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const isInitializedRef = useRef(false);
  const lastSelectionRef = useRef<{ index: number; length: number } | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({ top: 0, left: 0 });

  useEffect(() => {
    if (editorRef.current && !isInitializedRef.current) {
      isInitializedRef.current = true;

      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder,
        modules: {
          toolbar: false,
        },
      });

      quillRef.current.on('text-change', () => {
        if (quillRef.current) {
          const html = quillRef.current.root.innerHTML;
          onChange(html === '<p><br></p>' ? '' : html);
        }
      });

      quillRef.current.on('selection-change', (range) => {
        if (range && range.length > 0) {
          lastSelectionRef.current = { index: range.index, length: range.length };
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const domRange = selection.getRangeAt(0);
            const rect = domRange.getBoundingClientRect();
            const containerRect = containerRef.current?.getBoundingClientRect();

            if (containerRect) {
              setToolbarPosition({
                top: rect.bottom - containerRect.top + 8,
                left: rect.left - containerRect.left,
              });
              setShowToolbar(true);
            }
          }
        } else {
          setShowToolbar(false);
        }
      });

      if (value) {
        quillRef.current.root.innerHTML = value;
      }
    }
  }, [placeholder, onChange, value]);

  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      const selection = quillRef.current.getSelection();
      quillRef.current.root.innerHTML = value || '';
      if (selection) {
        quillRef.current.setSelection(selection);
      }
    }
  }, [value]);

  const formatText = useCallback((format: string, formatValue?: string | boolean | number) => {
    const quill = quillRef.current;
    const savedRange = lastSelectionRef.current;

    if (!quill || !savedRange) return;

    // Focus the editor first
    quill.focus();

    // Restore selection
    quill.setSelection(savedRange.index, savedRange.length, 'silent');

    // Get current format at selection
    const currentFormat = quill.getFormat(savedRange.index, savedRange.length);

    if (format === 'header' || format === 'list') {
      // Block-level formatting - toggle
      const currentValue = currentFormat[format];
      const newValue = currentValue === formatValue ? false : formatValue;

      // Use format() which works on the current selection
      quill.format(format, newValue, 'user');
    } else {
      // Inline formatting - toggle
      const isActive = !!currentFormat[format];
      quill.format(format, !isActive, 'user');
    }
  }, []);

  const toolbarButtons = [
    { icon: Heading1, action: () => formatText('header', 1), title: 'Heading 1' },
    { icon: Heading2, action: () => formatText('header', 2), title: 'Heading 2' },
    { icon: Heading3, action: () => formatText('header', 3), title: 'Heading 3' },
    { type: 'separator' },
    { icon: List, action: () => formatText('list', 'bullet'), title: 'Bullet List' },
    { icon: ListOrdered, action: () => formatText('list', 'ordered'), title: 'Numbered List' },
    { icon: CheckSquare, action: () => formatText('list', 'check'), title: 'Checklist' },
    { type: 'separator' },
    { icon: Bold, action: () => formatText('bold'), title: 'Bold' },
    { icon: Italic, action: () => formatText('italic'), title: 'Italic' },
    { icon: Underline, action: () => formatText('underline'), title: 'Underline' },
    { icon: Strikethrough, action: () => formatText('strike'), title: 'Strikethrough' },
    { icon: Code, action: () => formatText('code'), title: 'Code' },
  ];

  return (
    <div ref={containerRef} className={cn('notes-editor relative', className)}>
      <div ref={editorRef} className="min-h-[300px] border-none focus:outline-none" />

      {showToolbar && (
        <div
          className="absolute z-50 flex items-center gap-1 p-2 bg-card border border-border rounded-lg shadow-lg"
          style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {toolbarButtons.map((btn, index) => {
            if (btn.type === 'separator') {
              return <div key={index} className="w-px h-5 bg-border mx-1" />;
            }
            if (!btn.icon) return null;
            const Icon = btn.icon;
            return (
              <button
                key={index}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (btn.action) btn.action();
                }}
                title={btn.title}
                type="button"
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        .notes-editor .ql-container {
          border: none !important;
          font-size: 1rem;
        }
        .notes-editor .ql-editor {
          padding: 0;
          color: hsl(var(--card-foreground));
        }
        .notes-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
          left: 0;
        }
        .notes-editor .ql-editor h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .notes-editor .ql-editor h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .notes-editor .ql-editor h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .notes-editor .ql-editor p {
          margin-bottom: 0.5rem;
        }
        .notes-editor .ql-editor ul,
        .notes-editor .ql-editor ol {
          padding-left: 1.5rem;
        }
        .notes-editor .ql-editor code {
          background: hsl(var(--muted));
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}

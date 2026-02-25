import { BubbleMenu } from '@tiptap/react/menus';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui-kit/button';
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  ArrowDownToLine,
  Minus,
  Plus,
  Trash2,
  Table as TableIcon,
} from 'lucide-react';

interface TableBubbleMenuProps {
  editor: Editor;
}

export function TableBubbleMenu({ editor }: TableBubbleMenuProps) {
  const shouldShow = () => {
    // Only show table menu when table is active and callout is not active
    return editor.isActive('table') && !editor.isActive('callout');
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableBubbleMenu"
      shouldShow={shouldShow}
      updateDelay={0}
      className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-1 shadow-lg"
    >
      {/* Add column before */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        className="h-8 w-8 p-0"
        title="Add column before"
      >
        <ArrowLeftToLine className="h-4 w-4" />
      </Button>

      {/* Add column after */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        className="h-8 w-8 p-0"
        title="Add column after"
      >
        <ArrowRightToLine className="h-4 w-4" />
      </Button>

      {/* Delete column */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        className="h-8 w-8 p-0"
        title="Delete column"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Add row before */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().addRowBefore().run()}
        className="h-8 w-8 p-0"
        title="Add row before"
      >
        <ArrowUpToLine className="h-4 w-4" />
      </Button>

      {/* Add row after */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        className="h-8 w-8 p-0"
        title="Add row after"
      >
        <ArrowDownToLine className="h-4 w-4" />
      </Button>

      {/* Delete row */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().deleteRow().run()}
        className="h-8 w-8 p-0"
        title="Delete row"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Merge cells */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().mergeCells().run()}
        className="h-8 w-8 p-0"
        title="Merge cells"
      >
        <TableIcon className="h-4 w-4" />
      </Button>

      {/* Split cell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().splitCell().run()}
        className="h-8 w-8 p-0"
        title="Split cell"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* Delete table */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().deleteTable().run()}
        className="h-8 w-8 p-0"
        title="Delete table"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </BubbleMenu>
  );
}

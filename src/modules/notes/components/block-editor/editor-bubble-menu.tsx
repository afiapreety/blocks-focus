import { useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link as LinkIcon,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui-kit/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui-kit/dropdown-menu';

interface EditorBubbleMenuProps {
  editor: Editor;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const bubbleMenuRef = useRef<HTMLDivElement>(null);

  const setLink = () => {
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setShowLinkInput(false);
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const handleLinkClick = () => {
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setShowLinkInput(true);
  };

  const shouldShow = () => {
    const { from, to } = editor.state.selection;
    const isTextSelected = from !== to;

    // Only show when text is selected and not in table or callout
    return isTextSelected && !editor.isActive('table') && !editor.isActive('callout');
  };

  if (showLinkInput) {
    return (
      <BubbleMenu
        editor={editor}
        pluginKey="editorBubbleMenuLink"
        shouldShow={shouldShow}
        updateDelay={0}
        className="flex items-center gap-1 rounded-lg border border-border bg-background p-1 shadow-lg"
      >
        <input
          type="url"
          placeholder="Enter URL"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setLink();
            } else if (e.key === 'Escape') {
              setShowLinkInput(false);
              setLinkUrl('');
            }
          }}
          className="h-8 w-64 rounded border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
        />
        <Button variant="ghost" size="sm" onClick={setLink} className="h-8 px-2 text-xs">
          Set
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowLinkInput(false);
            setLinkUrl('');
          }}
          className="h-8 px-2 text-xs"
        >
          Cancel
        </Button>
      </BubbleMenu>
    );
  }

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="editorBubbleMenu"
      shouldShow={shouldShow}
      updateDelay={0}
      className="flex items-center gap-1 rounded-lg border border-border bg-background p-1 shadow-lg"
    >
      <div ref={bubbleMenuRef} className="contents">
        {/* Text Style Dropdown */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
              <span className="text-sm font-medium">
                {editor.isActive('heading', { level: 1 })
                  ? 'Heading 1'
                  : editor.isActive('heading', { level: 2 })
                    ? 'Heading 2'
                    : editor.isActive('heading', { level: 3 })
                      ? 'Heading 3'
                      : editor.isActive('taskList')
                        ? 'To-do List'
                        : editor.isActive('bulletList')
                          ? 'Bullet List'
                          : editor.isActive('orderedList')
                            ? 'Numbered List'
                            : editor.isActive('blockquote')
                              ? 'Blockquote'
                              : editor.isActive('codeBlock')
                                ? 'Code'
                                : 'Text'}
              </span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-48"
            sideOffset={8}
            container={bubbleMenuRef.current}
          >
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().setParagraph().run();
              }}
              className={editor.isActive('paragraph') ? 'bg-accent' : ''}
            >
              Text
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              }}
              className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
            >
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              }}
              className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
            >
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleHeading({ level: 3 }).run();
              }}
              className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
            >
              Heading 3
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleTaskList().run();
              }}
              className={editor.isActive('taskList') ? 'bg-accent' : ''}
            >
              To-do List
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleBulletList().run();
              }}
              className={editor.isActive('bulletList') ? 'bg-accent' : ''}
            >
              Bullet List
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleOrderedList().run();
              }}
              className={editor.isActive('orderedList') ? 'bg-accent' : ''}
            >
              Numbered List
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleBlockquote().run();
              }}
              className={editor.isActive('blockquote') ? 'bg-accent' : ''}
            >
              Blockquote
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleCodeBlock().run();
              }}
              className={editor.isActive('codeBlock') ? 'bg-accent' : ''}
            >
              Code
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px bg-border" />

        {/* Bold */}
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
          className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-accent' : ''}`}
        >
          <Bold className="h-4 w-4" />
        </Button>

        {/* Italic */}
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
          }}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-accent' : ''}`}
        >
          <Italic className="h-4 w-4" />
        </Button>

        {/* Underline */}
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleUnderline().run();
          }}
          className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-accent' : ''}`}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        {/* Strikethrough */}
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleStrike().run();
          }}
          className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-accent' : ''}`}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        {/* Code */}
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleCode().run();
          }}
          className={`h-8 w-8 p-0 ${editor.isActive('code') ? 'bg-accent' : ''}`}
        >
          <Code className="h-4 w-4" />
        </Button>

        {/* Link */}
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            handleLinkClick();
          }}
          className={`h-8 w-8 p-0 ${editor.isActive('link') ? 'bg-accent' : ''}`}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
    </BubbleMenu>
  );
}

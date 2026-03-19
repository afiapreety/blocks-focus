import { BubbleMenu } from '@tiptap/react/menus';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui-kit/button';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface CalloutBubbleMenuProps {
  editor: Editor;
}

export function CalloutBubbleMenu({ editor }: CalloutBubbleMenuProps) {
  const shouldShow = () => {
    // Show callout menu when callout is active (takes priority over table)
    return editor.isActive('callout');
  };

  const getCurrentType = () => {
    const attrs = editor.getAttributes('callout');
    return attrs.type || 'info';
  };

  const setCalloutType = (type: string) => {
    editor.chain().focus().updateAttributes('callout', { type }).run();
  };

  const currentType = getCurrentType();

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="calloutBubbleMenu"
      shouldShow={shouldShow}
      updateDelay={0}
      className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-1 shadow-lg"
    >
      {/* Info */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCalloutType('info')}
        className={`h-8 w-8 p-0 ${currentType === 'info' ? 'bg-accent' : ''}`}
        title="Info"
      >
        <Info className="h-4 w-4 text-blue-500" />
      </Button>

      {/* Success */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCalloutType('success')}
        className={`h-8 w-8 p-0 ${currentType === 'success' ? 'bg-accent' : ''}`}
        title="Success"
      >
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      </Button>

      {/* Warning */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCalloutType('warning')}
        className={`h-8 w-8 p-0 ${currentType === 'warning' ? 'bg-accent' : ''}`}
        title="Warning"
      >
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
      </Button>

      {/* Danger */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCalloutType('danger')}
        className={`h-8 w-8 p-0 ${currentType === 'danger' ? 'bg-accent' : ''}`}
        title="Danger"
      >
        <XCircle className="h-4 w-4 text-red-500" />
      </Button>
    </BubbleMenu>
  );
}

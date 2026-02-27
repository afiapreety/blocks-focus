import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export function CalloutNodeView({ node }: NodeViewProps) {
  const type = (node.attrs.type as string) || 'info';

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'danger':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <NodeViewWrapper className={`callout callout-${type}`}>
      <div className="callout-icon">{getIcon()}</div>
      <NodeViewContent className="callout-content" />
    </NodeViewWrapper>
  );
}

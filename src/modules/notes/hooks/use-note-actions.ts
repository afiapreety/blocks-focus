import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface UseNoteActionsProps {
  noteId?: string;
  noteTitle?: string;
  noteContent?: string;
}

export function useNoteActions({ noteId, noteTitle, noteContent }: UseNoteActionsProps = {}) {
  const { toast } = useToast();

  const handleDownload = (format: 'txt' | 'md' | 'pdf', title?: string, content?: string) => {
    const finalTitle = title || noteTitle || 'Untitled Note';
    const finalContent = content || noteContent || '';

    // For markdown content, remove markdown syntax for plain text
    const plainText = finalContent
      .replace(/^#{1,6}\s+/gm, '') // Remove heading markers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/`(.+?)`/g, '$1') // Remove inline code
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
      .replace(/^[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\d+\.\s+/gm, '') // Remove ordered list markers
      .trim();

    if (format === 'pdf') {
      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;

        // Add title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(finalTitle, maxWidth);
        doc.text(titleLines, margin, margin);

        // Add content
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const contentLines = doc.splitTextToSize(plainText, maxWidth);

        let yPosition = margin + titleLines.length * 7 + 10;

        contentLines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += 7;
        });

        doc.save(`${finalTitle}.pdf`);

        toast({
          variant: 'success',
          title: 'Note downloaded',
          description: 'Note downloaded as PDF successfully',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'PDF export failed',
          description: 'Failed to generate PDF. Please try again.',
        });
      }
      return;
    }

    // For markdown format, use content as-is; for txt, use plain text
    const fileContent = format === 'md' ? finalContent : plainText;
    const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${finalTitle}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      variant: 'success',
      title: 'Note downloaded',
      description: `Note downloaded as ${format.toUpperCase()} successfully`,
    });
  };

  const handleShare = (
    type: 'link' | 'clipboard',
    id?: string,
    title?: string,
    content?: string
  ) => {
    const finalId = id || noteId;
    const finalTitle = title || noteTitle || 'Untitled Note';
    const finalContent = content || noteContent || '';

    if (!finalId) {
      toast({
        variant: 'destructive',
        title: 'Cannot share',
        description: 'Please save the note first before sharing',
      });
      return;
    }

    const shareUrl = `${window.location.origin}/notes/${finalId}`;

    if (type === 'link') {
      navigator.clipboard.writeText(shareUrl);
      toast({
        variant: 'success',
        title: 'Link copied',
        description: 'Note link copied to clipboard',
      });
    } else if (type === 'clipboard') {
      // Copy markdown content as-is
      const contentToCopy = `# ${finalTitle}\n\n${finalContent}`;
      navigator.clipboard.writeText(contentToCopy);
      toast({
        variant: 'success',
        title: 'Content copied',
        description: 'Note content copied to clipboard',
      });
    }
  };

  const handleDelete = (id?: string, onDeleteCallback?: () => void) => {
    const finalId = id || noteId;

    if (!finalId) {
      toast({
        variant: 'destructive',
        title: 'Cannot delete',
        description: 'Note ID not found',
      });
      return;
    }

    if (onDeleteCallback) {
      onDeleteCallback();
    }
  };

  return {
    handleDownload,
    handleShare,
    handleDelete,
  };
}

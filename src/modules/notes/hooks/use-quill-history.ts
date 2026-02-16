import { useState } from 'react';

interface UseQuillHistoryReturn {
  quillInstance: any;
  canUndo: boolean;
  canRedo: boolean;
  handleQuillReady: (quill: any) => void;
  handleUndo: () => void;
  handleRedo: () => void;
}

export function useQuillHistory(): UseQuillHistoryReturn {
  const [quillInstance, setQuillInstance] = useState<any>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const handleQuillReady = (quill: any) => {
    setQuillInstance(quill);

    quill.on('text-change', () => {
      const history = quill.history;
      setCanUndo(history.stack.undo.length > 0);
      setCanRedo(history.stack.redo.length > 0);
    });
  };

  const handleUndo = () => {
    if (quillInstance) {
      quillInstance.history.undo();
    }
  };

  const handleRedo = () => {
    if (quillInstance) {
      quillInstance.history.redo();
    }
  };

  return {
    quillInstance,
    canUndo,
    canRedo,
    handleQuillReady,
    handleUndo,
    handleRedo,
  };
}

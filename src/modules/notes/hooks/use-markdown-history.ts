import { useState, useCallback, useRef } from 'react';

interface HistoryState {
  past: string[];
  present: string;
  future: string[];
}

export function useMarkdownHistory() {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef<HistoryState>({
    past: [],
    present: '',
    future: [],
  });
  const isInitializedRef = useRef(false);
  const isUndoRedoInProgressRef = useRef(false);

  const handleEditorReady = useCallback(() => {
    isInitializedRef.current = true;
  }, []);

  const updateHistory = useCallback((content: string) => {
    if (!isInitializedRef.current || isUndoRedoInProgressRef.current) return;

    const history = historyRef.current;

    if (content !== history.present) {
      historyRef.current = {
        past: [...history.past, history.present],
        present: content,
        future: [],
      };

      setCanUndo(historyRef.current.past.length > 0);
      setCanRedo(false);
    }
  }, []);

  const resetHistory = useCallback((initialContent: string) => {
    historyRef.current = {
      past: [],
      present: initialContent,
      future: [],
    };
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  const handleUndo = useCallback((): string | null => {
    const history = historyRef.current;

    if (history.past.length === 0) return null;

    isUndoRedoInProgressRef.current = true;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    historyRef.current = {
      past: newPast,
      present: previous,
      future: [history.present, ...history.future],
    };

    setCanUndo(newPast.length > 0);
    setCanRedo(true);

    setTimeout(() => {
      isUndoRedoInProgressRef.current = false;
    }, 0);

    return previous;
  }, []);

  const handleRedo = useCallback((): string | null => {
    const history = historyRef.current;

    if (history.future.length === 0) return null;

    isUndoRedoInProgressRef.current = true;
    const next = history.future[0];
    const newFuture = history.future.slice(1);

    historyRef.current = {
      past: [...history.past, history.present],
      present: next,
      future: newFuture,
    };

    setCanUndo(true);
    setCanRedo(newFuture.length > 0);

    setTimeout(() => {
      isUndoRedoInProgressRef.current = false;
    }, 0);

    return next;
  }, []);

  return {
    canUndo,
    canRedo,
    handleEditorReady,
    handleUndo,
    handleRedo,
    updateHistory,
    resetHistory,
  };
}

import { useState, useCallback, useRef } from 'react';

interface HistoryState {
  title: string;
  content: string;
}

interface UseUndoRedoReturn {
  title: string;
  content: string;
  setTitle: (value: string) => void;
  setContent: (value: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  resetHistory: (initialState: HistoryState) => void;
}

export function useUndoRedo(initialTitle = '', initialContent = ''): UseUndoRedoReturn {
  const [title, setTitleState] = useState(initialTitle);
  const [content, setContentState] = useState(initialContent);
  const [history, setHistory] = useState<HistoryState[]>([
    { title: initialTitle, content: initialContent },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUndoRedoRef = useRef(false);

  const saveToHistory = useCallback(
    (newTitle: string, newContent: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        if (isUndoRedoRef.current) {
          isUndoRedoRef.current = false;
          return;
        }

        setHistory((prev) => {
          const newHistory = prev.slice(0, historyIndex + 1);
          const newState = { title: newTitle, content: newContent };

          const lastState = newHistory[newHistory.length - 1];
          if (lastState && lastState.title === newTitle && lastState.content === newContent) {
            return prev;
          }

          newHistory.push(newState);
          return newHistory;
        });
        setHistoryIndex((prev) => prev + 1);
      }, 500);
    },
    [historyIndex]
  );

  const setTitle = useCallback(
    (value: string) => {
      setTitleState(value);
      saveToHistory(value, content);
    },
    [content, saveToHistory]
  );

  const setContent = useCallback(
    (value: string) => {
      setContentState(value);
      saveToHistory(title, value);
    },
    [title, saveToHistory]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      isUndoRedoRef.current = true;
      const newIndex = historyIndex - 1;
      const prevState = history[newIndex];

      setHistoryIndex(newIndex);
      setTitleState(prevState.title);
      setContentState(prevState.content);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      isUndoRedoRef.current = true;
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];

      setHistoryIndex(newIndex);
      setTitleState(nextState.title);
      setContentState(nextState.content);
    }
  }, [historyIndex, history]);

  const resetHistory = useCallback((initialState: HistoryState) => {
    setTitleState(initialState.title);
    setContentState(initialState.content);
    setHistory([initialState]);
    setHistoryIndex(0);
  }, []);

  return {
    title,
    content,
    setTitle,
    setContent,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    resetHistory,
  };
}

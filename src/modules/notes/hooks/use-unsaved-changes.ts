import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate, UNSAFE_NavigationContext } from 'react-router-dom';
import { useContext } from 'react';

export function useUnsavedChanges(hasUnsavedChanges: boolean, onDiscardCallback?: () => void) {
  const [showDialog, setShowDialog] = useState(false);
  const [nextLocation, setNextLocation] = useState<string | null>(null);
  const isNavigatingRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navigationContext = useContext(UNSAFE_NavigationContext);

  useEffect(() => {
    if (!hasUnsavedChanges || isNavigatingRef.current) return;

    const { navigator } = navigationContext;
    const originalPush = navigator.push;
    const originalReplace = navigator.replace;

    navigator.push = (...args: Parameters<typeof originalPush>) => {
      const [to] = args;
      const targetPath = typeof to === 'string' ? to : to.pathname;

      if (targetPath !== location.pathname) {
        setNextLocation(targetPath || '');
        setShowDialog(true);
      } else {
        originalPush(...args);
      }
    };

    navigator.replace = (...args: Parameters<typeof originalReplace>) => {
      const [to] = args;
      const targetPath = typeof to === 'string' ? to : to.pathname;

      if (targetPath !== location.pathname) {
        setNextLocation(targetPath || '');
        setShowDialog(true);
      } else {
        originalReplace(...args);
      }
    };

    return () => {
      navigator.push = originalPush;
      navigator.replace = originalReplace;
    };
  }, [hasUnsavedChanges, location.pathname, navigationContext]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isNavigatingRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleClose = useCallback(() => {
    setShowDialog(false);
  }, []);

  const handleDiscard = useCallback(() => {
    setShowDialog(false);

    // Call the discard callback to reset content
    if (onDiscardCallback) {
      onDiscardCallback();
    }

    // Clear the next location since we're staying on the page
    setNextLocation(null);
  }, [onDiscardCallback]);

  const allowNavigation = useCallback(
    (shouldNavigate = true) => {
      isNavigatingRef.current = true;
      setShowDialog(false);

      if (shouldNavigate && nextLocation) {
        navigate(nextLocation);
        setNextLocation(null);
      } else if (!shouldNavigate) {
        setNextLocation(null);
      }

      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 100);
    },
    [nextLocation, navigate]
  );

  return {
    showDialog,
    handleClose,
    handleDiscard,
    allowNavigation,
  };
}

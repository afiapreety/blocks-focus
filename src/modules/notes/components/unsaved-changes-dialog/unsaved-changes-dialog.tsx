import { ConfirmationModal } from '@/components/core/confirmation-modal/confirmation-modal';

type UnsavedChangesDialogProps = {
  open: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSave: () => void;
};

export function UnsavedChangesDialog({
  open,
  onClose,
  onDiscard,
  onSave,
}: UnsavedChangesDialogProps) {
  return (
    <ConfirmationModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      onCancel={onDiscard}
      title="Unsaved Changes"
      description="You have unsaved changes. Do you want to save them before leaving?"
      onConfirm={onSave}
      confirmText="Save Changes"
      cancelText="Discard Changes"
      preventAutoClose={false}
      showCloseButton={true}
    />
  );
}

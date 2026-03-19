export function NotesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
      <h2 className="text-xl font-semibold text-foreground/70 mb-2">No Notes</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        Create your first note by clicking on the plus button in the header.
      </p>
    </div>
  );
}

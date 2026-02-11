export function NotesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <h2 className="text-xl font-semibold text-muted-foreground mb-2">No Notes</h2>
      <p className="text-sm text-muted-foreground">
        Create your first note by clicking on the plus button in the header.
      </p>
    </div>
  );
}

import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui-kit/button';

export function NotesHeader() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-foreground">Notes</h1>
      <Button
        onClick={() => navigate('/notes/create')}
        variant="outline"
        size="icon"
        className="rounded-full h-10 w-10"
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
}

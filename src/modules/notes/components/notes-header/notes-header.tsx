import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui-kit/button';

export function NotesHeader() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Notes</h1>
      <Button
        onClick={() => navigate('/notes/create')}
        size="icon"
        className="rounded-full h-12 w-12"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}

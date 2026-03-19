import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui-kit/button';
import { useTranslation } from 'react-i18next';

export function NotesHeader() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-foreground">Notes</h1>
      <Button onClick={() => navigate('/notes/create')}>
        <Plus className="h-5 w-5" />
        <span className="hidden sm:inline">{t('ADD_NOTE')}</span>
      </Button>
    </div>
  );
}

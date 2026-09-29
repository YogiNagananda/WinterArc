import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

export function QuickNoteButton() {
  const navigate = useNavigate();

  return (
    <button
      className="fab"
      onClick={() => navigate('/notes?new=true')}
      aria-label="Quick note"
      title="New quick note"
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
}

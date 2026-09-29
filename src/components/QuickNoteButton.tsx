import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

export function QuickNoteButton() {
  const navigate = useNavigate();

  return (
    <button
      className="btn btn-primary"
      style={{
        position: 'fixed',
        bottom: '5.5rem',
        right: '1.25rem',
        width: '48px',
        height: '48px',
        borderRadius: 'var(--radius-full)',
        padding: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow-accent)',
      }}
      onClick={() => navigate('/notes?new=true')}
      aria-label="Quick note"
      title="New quick note"
    >
      <Plus size={22} />
    </button>
  );
}

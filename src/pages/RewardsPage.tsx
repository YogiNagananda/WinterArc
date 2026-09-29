import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Gift, ShoppingCart, Award, Zap } from 'lucide-react';
import { useStore } from '../store';
import { useToast } from '../components/Toast';
import { badges as allBadges } from '../data/badges';
import type { Reward } from '../types';
import { format } from 'date-fns';

export function RewardsPage() {
  const profile = useStore(s => s.profile);
  const rewards = useStore(s => s.rewards);
  const redemptions = useStore(s => s.redemptions);
  const earnedBadges = useStore(s => s.earnedBadges);
  const addReward = useStore(s => s.addReward);
  const archiveReward = useStore(s => s.archiveReward);
  const redeemReward = useStore(s => s.redeemReward);
  const toast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<'rewards' | 'badges' | 'history'>('rewards');

  const activeRewards = useMemo(() => rewards.filter(r => !r.archived), [rewards]);

  const handleRedeem = async (rewardId: string) => {
    const success = await redeemReward(rewardId);
    if (success) {
      toast('Reward redeemed! 🎉', 'success');
    } else {
      toast('Not enough XP!', 'error');
    }
  };

  const redemptionHistory = useMemo(() => {
    return [...redemptions]
      .sort((a, b) => b.redeemedAt.localeCompare(a.redeemedAt))
      .map(r => {
        const reward = rewards.find(rw => rw.id === r.rewardId);
        return { ...r, rewardTitle: reward?.title ?? 'Unknown', cost: reward?.cost ?? 0 };
      });
  }, [redemptions, rewards]);

  const earnedBadgeIds = useMemo(() => new Set(earnedBadges.map(b => b.badgeId)), [earnedBadges]);

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 className="page-title">Rewards</h1>
            <p className="page-subtitle">Earn and spend your XP</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Reward
          </button>
        </div>
      </div>

      {/* XP Balance */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total XP</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-xp)' }}>{profile.totalXp}</div>
        </div>
        <div style={{ borderLeft: '1px solid var(--color-border)', margin: '0 1rem' }} />
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Spendable</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)' }}>{profile.spendableXp}</div>
        </div>
        <div style={{ borderLeft: '1px solid var(--color-border)', margin: '0 1rem' }} />
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Spent</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-warning)' }}>{profile.totalXp - profile.spendableXp}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['rewards', 'badges', 'history'] as const).map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'rewards' && (
        activeRewards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎁</div>
            <div className="empty-state-title">No rewards yet</div>
            <div className="empty-state-text">Create rewards you can redeem with earned XP!</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {activeRewards.map(reward => (
              <motion.div
                key={reward.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card"
                style={{ padding: '1.25rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Gift size={20} style={{ color: 'var(--color-accent)' }} />
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { archiveReward(reward.id); toast('Reward archived', 'info'); }}>
                    <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                  </button>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginTop: '0.5rem' }}>{reward.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <Zap size={12} style={{ color: 'var(--color-xp)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-xp)' }}>{reward.cost} XP</span>
                </div>
                <button
                  className={`btn ${profile.spendableXp >= reward.cost ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ width: '100%', marginTop: '0.75rem' }}
                  disabled={profile.spendableXp < reward.cost}
                  onClick={() => handleRedeem(reward.id)}
                >
                  <ShoppingCart size={12} /> Redeem
                </button>
              </motion.div>
            ))}
          </div>
        )
      )}

      {tab === 'badges' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {allBadges.map(badge => {
            const earned = earnedBadgeIds.has(badge.id);
            return (
              <div
                key={badge.id}
                className="glass-card"
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  opacity: earned ? 1 : 0.4,
                  borderColor: earned ? 'rgba(56, 189, 248, 0.3)' : undefined,
                }}
              >
                <div style={{ fontSize: '2rem' }}>{badge.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', marginTop: '0.25rem' }}>{badge.title}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{badge.description}</div>
                {earned && <div className="badge badge-success" style={{ marginTop: '0.375rem' }}>Earned!</div>}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'history' && (
        redemptionHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <div className="empty-state-title">No redemptions yet</div>
            <div className="empty-state-text">Redeem a reward to see it here!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {redemptionHistory.map(r => (
              <div key={r.id} className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.rewardTitle}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                    {format(new Date(r.redeemedAt), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-xp)' }}>-{r.cost} XP</span>
              </div>
            ))}
          </div>
        )
      )}

      {/* Add Reward Modal */}
      <AnimatePresence>
        {showForm && (
          <RewardFormModal
            onClose={() => setShowForm(false)}
            onSave={async (data) => {
              await addReward(data);
              setShowForm(false);
              toast('Reward created!', 'success');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RewardFormModal({ onClose, onSave }: { onClose: () => void; onSave: (data: { title: string; cost: number }) => void }) {
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState(100);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title required'); return; }
    if (cost <= 0) { setError('Cost must be positive'); return; }
    onSave({ title: title.trim(), cost });
  };

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">New Reward</h2>
        <form onSubmit={handleSubmit}>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{error}</div>}
          <div style={{ marginBottom: '0.75rem' }}>
            <label className="label">Title *</label>
            <input className="input" value={title} onChange={e => { setTitle(e.target.value); setError(''); }} placeholder="e.g. Netflix night" />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label className="label">XP Cost</label>
            <input className="input" type="number" min={1} value={cost} onChange={e => setCost(Number(e.target.value))} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

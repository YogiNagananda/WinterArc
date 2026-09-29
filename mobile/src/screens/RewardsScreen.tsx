import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useWinterStore } from '../store/useWinterStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const RewardsScreen: React.FC = () => {
  const profile = useWinterStore(s => s.profile);
  const rewards = useWinterStore(s => s.rewards);
  const redemptions = useWinterStore(s => s.redemptions);
  const redeemReward = useWinterStore(s => s.redeemReward);
  const addReward = useWinterStore(s => s.addReward);

  const [modalVisible, setModalVisible] = useState(false);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardCost, setRewardCost] = useState('150');
  const [successToast, setSuccessToast] = useState('');

  const handleRedeem = async (id: string, title: string, cost: number) => {
    if (profile.spendableXp < cost) {
      Alert.alert(
        'Insufficient XP',
        `You need ${cost} spendable XP for this reward. Keep executing your daily habits!`
      );
      return;
    }

    const success = await redeemReward(id);
    if (success) {
      setSuccessToast(`🎉 Claimed "${title}"! Enjoy your reward.`);
      setTimeout(() => setSuccessToast(''), 4000);
    }
  };

  const handleCreate = async () => {
    if (!rewardTitle.trim()) return;
    await addReward(rewardTitle.trim(), parseInt(rewardCost) || 100);
    setRewardTitle('');
    setModalVisible(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Toast Alert */}
      {successToast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{successToast}</Text>
        </View>
      ) : null}

      {/* Spendable XP Balance Card */}
      <Card elevated style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>AVAILABLE DISCIPLINE XP</Text>
        <Text style={styles.balanceVal}>
          ⚡ {profile.spendableXp} <Text style={styles.balanceSub}>spendable</Text>
        </Text>
        <Text style={styles.balanceHint}>
          Earn XP by completing daily non-negotiables, workouts, study sprints, and goals.
        </Text>
      </Card>

      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Rewards Marketplace</Text>
        <Button
          title="+ Custom Reward"
          onPress={() => setModalVisible(true)}
          size="sm"
          variant="secondary"
        />
      </View>

      {/* Rewards Catalog */}
      {rewards.map(r => {
        const canAfford = profile.spendableXp >= r.cost;
        return (
          <Card key={r.id} style={styles.rewardCard}>
            <View style={styles.rewardRow}>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>{r.title}</Text>
                <Text style={styles.rewardCost}>⚡ {r.cost} XP</Text>
              </View>

              <Button
                title={canAfford ? 'REDEEM' : 'LOCKED'}
                onPress={() => handleRedeem(r.id, r.title, r.cost)}
                disabled={!canAfford}
                variant={canAfford ? 'primary' : 'ghost'}
                size="sm"
              />
            </View>
          </Card>
        );
      })}

      {/* Redemptions History */}
      <Text style={[styles.heading, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
        Claim History ({redemptions.length})
      </Text>
      {redemptions.length === 0 ? (
        <Text style={styles.emptyText}>No rewards redeemed yet. Work hard and earn your rewards!</Text>
      ) : (
        redemptions.slice(0, 5).map(red => {
          const item = rewards.find(r => r.id === red.rewardId);
          return (
            <View key={red.id} style={styles.historyRow}>
              <Text style={styles.historyTitle}>🎁 {item?.title || 'Reward'}</Text>
              <Text style={styles.historyTime}>
                {new Date(red.redeemedAt).toLocaleDateString()}
              </Text>
            </View>
          );
        })
      )}

      {/* Custom Reward Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Discipline Reward</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Cheat meal pizza, Buy new sneakers"
              placeholderTextColor={colors.textMuted}
              value={rewardTitle}
              onChangeText={setRewardTitle}
            />
            <Text style={styles.fieldLabel}>XP COST</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 200"
              placeholderTextColor={colors.textMuted}
              value={rewardCost}
              onChangeText={setRewardCost}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Create Reward"
                variant="primary"
                onPress={handleCreate}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  toast: {
    backgroundColor: colors.mintSubtle,
    borderWidth: 1,
    borderColor: colors.mintSuccess,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  toastText: {
    color: colors.mintSuccess,
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
  },
  balanceCard: {
    marginBottom: spacing.xl,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.iceBlue,
    letterSpacing: 1,
  },
  balanceVal: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    marginVertical: 4,
  },
  balanceSub: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  balanceHint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  rewardCard: {
    marginBottom: spacing.sm,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rewardCost: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.mintSuccess,
    marginTop: 2,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyTitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  historyTime: {
    color: colors.textMuted,
    fontSize: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.cardElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderActive,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.iceBlue,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 6,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});

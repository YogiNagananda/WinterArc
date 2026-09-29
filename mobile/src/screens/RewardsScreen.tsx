import React, { useState, useMemo } from 'react';
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
import { useTheme } from '../theme/colors';
import { useWinterStore } from '../store/useWinterStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const RewardsScreen: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
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

  const styles = useMemo(() => createStyles(colors, spacing, borderRadius), [colors, spacing, borderRadius]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Toast Alert */}
      {successToast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{successToast}</Text>
        </View>
      ) : null}

      {/* Spendable XP Vault */}
      <Card elevated style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>SPENDABLE XP VAULT</Text>
        <Text style={styles.balanceVal}>💎 {profile.spendableXp} XP</Text>
        <Text style={styles.balanceSub}>Earned from completing tasks, focus & workouts</Text>
        <Text style={styles.balanceHint}>
          Total Discipline XP: {profile.totalXp} • Spendable balance won't lower your total level.
        </Text>
      </Card>

      {/* Guilt-Free Entertainment Philosophy Tip */}
      <Card style={styles.philosophyCard}>
        <Text style={styles.philosophyTitle}>🎮 GUILT-FREE ENTERTAINMENT</Text>
        <Text style={styles.philosophyText}>
          Crushed your reading goal or cleared 100% of today's non-negotiables? Spend your earned XP on video games, movie nights, or TV series bingeing with zero regret. You earned every second.
        </Text>
      </Card>

      {/* Rewards Catalog */}
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Discipline Shop</Text>
        <Button
          title="+ Add Custom Reward"
          onPress={() => setModalVisible(true)}
          size="sm"
          variant="secondary"
        />
      </View>

      {rewards.map(reward => {
        const canAfford = profile.spendableXp >= reward.cost;
        return (
          <Card key={reward.id} style={styles.rewardCard}>
            <View style={styles.rewardRow}>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>🎁 {reward.title}</Text>
                <Text style={styles.rewardCost}>💎 {reward.cost} XP</Text>
              </View>
              <Button
                title={canAfford ? 'Redeem' : 'Locked'}
                onPress={() => handleRedeem(reward.id, reward.title, reward.cost)}
                disabled={!canAfford}
                variant={canAfford ? 'primary' : 'secondary'}
                size="sm"
              />
            </View>
          </Card>
        );
      })}

      {/* Redemption History */}
      <Text style={[styles.heading, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
        Claimed Rewards History
      </Text>
      <Card>
        {redemptions.length === 0 ? (
          <Text style={styles.emptyText}>No rewards claimed yet. Save your XP for something meaningful!</Text>
        ) : (
          redemptions.map(r => {
            const rewardObj = rewards.find(rew => rew.id === r.rewardId);
            return (
              <View key={r.id} style={styles.historyRow}>
                <Text style={styles.historyTitle}>✓ {rewardObj?.title || 'Reward'}</Text>
                <Text style={styles.historyTime}>
                  {new Date(r.redeemedAt).toLocaleDateString()}
                </Text>
              </View>
            );
          })
        )}
      </Card>

      {/* Add Custom Reward Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Reward</Text>
            <TextInput
              style={styles.input}
              placeholder="Reward (e.g. Cheat Meal, Movie Night)"
              placeholderTextColor={colors.textMuted}
              value={rewardTitle}
              onChangeText={setRewardTitle}
            />
            <Text style={styles.fieldLabel}>XP COST</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 150"
              placeholderTextColor={colors.textMuted}
              value={rewardCost}
              onChangeText={setRewardCost}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                title="Add to Shop"
                onPress={handleCreate}
                variant="primary"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const createStyles = (colors: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
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
    philosophyCard: {
      marginBottom: spacing.lg,
      borderLeftWidth: 3,
      borderLeftColor: colors.iceBlue,
      backgroundColor: colors.cardElevated,
    },
    philosophyTitle: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.iceBlue,
      letterSpacing: 1,
      marginBottom: 4,
    },
    philosophyText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
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

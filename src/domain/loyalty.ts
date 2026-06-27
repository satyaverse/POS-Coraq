import { Tier } from '../../types';
import { TIER_RULES } from '../../constants';

export function calculatePointRedemption(
  pointsToRedeem: number,
  availablePoints: number,
  pointValue: number,
): number {
  const normalizedPoints = Math.max(0, pointsToRedeem);
  if (normalizedPoints > availablePoints) {
    throw new Error('Point redemption exceeds available member points');
  }

  return normalizedPoints * pointValue;
}

export function calculatePointsEarned(finalAmount: number, pointEarnRate: number): number {
  if (pointEarnRate <= 0) return 0;
  return Math.floor(Math.max(0, finalAmount) / pointEarnRate);
}

export function resolveTier(totalSpending: number): Tier {
  if (totalSpending > TIER_RULES[Tier.PLATINUM].threshold) return Tier.PLATINUM;
  if (totalSpending > TIER_RULES[Tier.GOLD].threshold) return Tier.GOLD;
  if (totalSpending > TIER_RULES[Tier.SILVER].threshold) return Tier.SILVER;
  return Tier.BRONZE;
}

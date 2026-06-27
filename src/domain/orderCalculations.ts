import { CartItem, Member, MemberStatus, Promotion, StoreConfig } from '../../types';
import { TIER_RULES } from '../../constants';
import { calculatePointRedemption, calculatePointsEarned } from './loyalty';

export interface OrderTotals {
  subtotal: number;
  tierDiscount: number;
  promotionDiscount: number;
  pointDiscount: number;
  totalDiscount: number;
  finalAmount: number;
  pointsEarned: number;
  appliedPromotionNames: string[];
}

export function calculateOrderTotals(_input: {
  cart: CartItem[];
  member: Member | null;
  promotions: Promotion[];
  storeConfig: StoreConfig;
  pointsToRedeem: number;
}): OrderTotals {
  const { cart, member, promotions, storeConfig, pointsToRedeem } = _input;

  const subtotal = cart.reduce((acc, item) => {
    const modifierTotal = item.modifiers.reduce((modifierAcc, modifier) => {
      return modifierAcc + modifier.price;
    }, 0);

    return acc + (item.product.price + modifierTotal) * item.quantity;
  }, 0);

  const tierDiscount =
    member && member.status === MemberStatus.ACTIVE
      ? subtotal * TIER_RULES[member.tier].discount
      : 0;

  let promotionDiscount = 0;
  const appliedPromotionNames: string[] = [];

  for (const promotion of promotions) {
    if (!promotion.active) continue;
    if (promotion.minSpend && subtotal < promotion.minSpend) continue;

    if (promotion.type === 'PERCENTAGE') {
      promotionDiscount += subtotal * (promotion.value / 100);
      appliedPromotionNames.push(promotion.name);
    } else if (promotion.type === 'FIXED') {
      promotionDiscount += promotion.value;
      appliedPromotionNames.push(promotion.name);
    }
  }

  const pointDiscount = calculatePointRedemption(
    pointsToRedeem,
    member?.points ?? 0,
    storeConfig.pointValue,
  );
  const totalDiscount = Math.min(subtotal, tierDiscount + promotionDiscount + pointDiscount);
  const finalAmount = subtotal - totalDiscount;
  const pointsEarned = member
    ? calculatePointsEarned(finalAmount, storeConfig.pointEarnRate)
    : 0;

  return {
    subtotal,
    tierDiscount,
    promotionDiscount,
    pointDiscount,
    totalDiscount,
    finalAmount,
    pointsEarned,
    appliedPromotionNames,
  };
}

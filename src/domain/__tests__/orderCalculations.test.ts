import { MemberStatus, Tier } from '../../../types';
import {
  fixtureActivePromotion,
  fixtureBronzeMember,
  fixtureModifiers,
  fixturePercentPromotion,
  fixtureProducts,
  fixtureStoreConfig,
  makeCartItem,
} from './fixtures';
import { calculateOrderTotals } from '../orderCalculations';
import {
  calculatePointRedemption,
  calculatePointsEarned,
  resolveTier,
} from '../loyalty';

describe('calculateOrderTotals', () => {
  it('calculates subtotal from product price, modifier price, and quantity', () => {
    const result = calculateOrderTotals({
      cart: [
        makeCartItem({
          product: fixtureProducts.coffee,
          quantity: 2,
          modifiers: [fixtureModifiers.extraShot],
        }),
      ],
      member: null,
      promotions: [],
      storeConfig: fixtureStoreConfig,
      pointsToRedeem: 0,
    });

    expect(result.subtotal).toBe(60000);
    expect(result.finalAmount).toBe(60000);
  });

  it('applies tier discount for active members', () => {
    const silverMember = {
      ...fixtureBronzeMember,
      tier: Tier.SILVER,
      status: MemberStatus.ACTIVE,
    };

    const result = calculateOrderTotals({
      cart: [makeCartItem({ product: fixtureProducts.coffee, quantity: 2 })],
      member: silverMember,
      promotions: [],
      storeConfig: fixtureStoreConfig,
      pointsToRedeem: 0,
    });

    expect(result.subtotal).toBe(50000);
    expect(result.tierDiscount).toBe(2500);
    expect(result.finalAmount).toBe(47500);
  });

  it('applies active promotions that meet minimum spend', () => {
    const result = calculateOrderTotals({
      cart: [makeCartItem({ product: fixtureProducts.coffee, quantity: 5 })],
      member: null,
      promotions: [fixtureActivePromotion, fixturePercentPromotion],
      storeConfig: fixtureStoreConfig,
      pointsToRedeem: 0,
    });

    expect(result.subtotal).toBe(125000);
    expect(result.promotionDiscount).toBe(35000);
    expect(result.appliedPromotionNames).toEqual([
      fixtureActivePromotion.name,
      fixturePercentPromotion.name,
    ]);
    expect(result.finalAmount).toBe(90000);
  });

  it('ignores inactive promotions and promotions below minimum spend', () => {
    const result = calculateOrderTotals({
      cart: [makeCartItem({ product: fixtureProducts.coffee, quantity: 1 })],
      member: null,
      promotions: [
        { ...fixtureActivePromotion, minSpend: 100000 },
        { ...fixturePercentPromotion, active: false },
      ],
      storeConfig: fixtureStoreConfig,
      pointsToRedeem: 0,
    });

    expect(result.promotionDiscount).toBe(0);
    expect(result.appliedPromotionNames).toEqual([]);
    expect(result.finalAmount).toBe(25000);
  });

  it('applies point redemption and caps total discount at subtotal', () => {
    const result = calculateOrderTotals({
      cart: [makeCartItem({ product: fixtureProducts.coffee, quantity: 1 })],
      member: fixtureBronzeMember,
      promotions: [{ ...fixtureActivePromotion, minSpend: 0, value: 50000 }],
      storeConfig: fixtureStoreConfig,
      pointsToRedeem: 10,
    });

    expect(result.pointDiscount).toBe(1000);
    expect(result.totalDiscount).toBe(25000);
    expect(result.finalAmount).toBe(0);
  });

  it('calculates earned points from final amount', () => {
    const result = calculateOrderTotals({
      cart: [makeCartItem({ product: fixtureProducts.coffee, quantity: 3 })],
      member: fixtureBronzeMember,
      promotions: [],
      storeConfig: fixtureStoreConfig,
      pointsToRedeem: 0,
    });

    expect(result.finalAmount).toBe(75000);
    expect(result.pointsEarned).toBe(7);
  });

  it('rejects redemption greater than available member points', () => {
    expect(() =>
      calculateOrderTotals({
        cart: [makeCartItem({ product: fixtureProducts.coffee, quantity: 1 })],
        member: fixtureBronzeMember,
        promotions: [],
        storeConfig: fixtureStoreConfig,
        pointsToRedeem: fixtureBronzeMember.points + 1,
      }),
    ).toThrow('Point redemption exceeds available member points');
  });
});

describe('loyalty helpers', () => {
  it('calculates redemption value from points and point value', () => {
    expect(calculatePointRedemption(10, 20, 100)).toBe(1000);
  });

  it('rejects redemption when points are not enough', () => {
    expect(() => calculatePointRedemption(21, 20, 100)).toThrow(
      'Point redemption exceeds available member points',
    );
  });

  it('calculates points earned by flooring final amount over earn rate', () => {
    expect(calculatePointsEarned(75999, 10000)).toBe(7);
  });

  it('resolves member tier from total spending thresholds', () => {
    expect(resolveTier(0)).toBe(Tier.BRONZE);
    expect(resolveTier(1000001)).toBe(Tier.SILVER);
    expect(resolveTier(3000001)).toBe(Tier.GOLD);
    expect(resolveTier(8000001)).toBe(Tier.PLATINUM);
  });
});

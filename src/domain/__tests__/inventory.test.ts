import { Expense } from '../../../types';
import {
  cloneFixture,
  fixtureIngredients,
  fixtureModifiers,
  fixtureProducts,
  makeCartItem,
} from './fixtures';
import {
  applyStockDeduction,
  calculateAverageCost,
  isPriceAnomaly,
  rollbackPurchase,
  rollbackStockDeduction,
  validateStockAvailability,
} from '../inventory';

describe('inventory stock deduction', () => {
  it('deducts product recipe stock multiplied by quantity', () => {
    const ingredients = cloneFixture(fixtureIngredients);
    const cart = [makeCartItem({ product: fixtureProducts.coffee, quantity: 2 })];

    const updated = applyStockDeduction(ingredients, cart);

    expect(updated.find(i => i.id === 'ing-espresso')?.stock).toBe(4964);
    expect(updated.find(i => i.id === 'ing-milk')?.stock).toBe(9700);
    expect(updated.find(i => i.id === 'ing-cup')?.stock).toBe(498);
  });

  it('deducts modifier recipe stock multiplied by item quantity', () => {
    const ingredients = cloneFixture(fixtureIngredients);
    const cart = [
      makeCartItem({
        product: fixtureProducts.coffee,
        quantity: 2,
        modifiers: [fixtureModifiers.extraShot],
      }),
    ];

    const updated = applyStockDeduction(ingredients, cart);

    expect(updated.find(i => i.id === 'ing-espresso')?.stock).toBe(4928);
  });

  it('rolls back product and modifier stock deduction', () => {
    const ingredients = cloneFixture(fixtureIngredients);
    const cart = [
      makeCartItem({
        product: fixtureProducts.coffee,
        quantity: 2,
        modifiers: [fixtureModifiers.extraShot],
      }),
    ];

    const deducted = applyStockDeduction(ingredients, cart);
    const rolledBack = rollbackStockDeduction(deducted, cart);

    expect(rolledBack.find(i => i.id === 'ing-espresso')?.stock).toBe(5000);
    expect(rolledBack.find(i => i.id === 'ing-milk')?.stock).toBe(10000);
    expect(rolledBack.find(i => i.id === 'ing-cup')?.stock).toBe(500);
  });

  it('returns product stock failure when ingredient stock is insufficient', () => {
    const ingredients = cloneFixture(fixtureIngredients).map(ingredient =>
      ingredient.id === 'ing-espresso' ? { ...ingredient, stock: 10 } : ingredient,
    );
    const cart = [makeCartItem({ product: fixtureProducts.coffee, quantity: 1 })];

    const result = validateStockAvailability(ingredients, cart);

    expect(result).toEqual({
      ok: false,
      message: 'Stok tidak cukup untuk Kopi Susu (Bahan: Biji Espresso)',
    });
  });

  it('returns modifier stock failure when modifier ingredient stock is insufficient', () => {
    const ingredients = cloneFixture(fixtureIngredients).map(ingredient =>
      ingredient.id === 'ing-espresso' ? { ...ingredient, stock: 20 } : ingredient,
    );
    const cart = [
      makeCartItem({
        product: { ...fixtureProducts.coffee, recipe: [] },
        quantity: 2,
        modifiers: [fixtureModifiers.extraShot],
      }),
    ];

    const result = validateStockAvailability(ingredients, cart);

    expect(result).toEqual({
      ok: false,
      message: 'Stok tidak cukup untuk Modifier Extra Shot (Bahan: Biji Espresso)',
    });
  });
});

describe('inventory purchase helpers', () => {
  it('calculates weighted average cost', () => {
    const cost = calculateAverageCost({
      currentStock: 100,
      currentCostPerUnit: 10,
      addedUsageQty: 100,
      purchaseCostPerUsageUnit: 20,
    });

    expect(cost).toBe(15);
  });

  it('returns purchase cost when stock starts at zero', () => {
    const cost = calculateAverageCost({
      currentStock: 0,
      currentCostPerUnit: 0,
      addedUsageQty: 50,
      purchaseCostPerUsageUnit: 30,
    });

    expect(cost).toBe(30);
  });

  it('detects price anomaly above threshold', () => {
    expect(isPriceAnomaly(100, 121)).toBe(true);
    expect(isPriceAnomaly(100, 119)).toBe(false);
  });

  it('rolls back purchase metadata', () => {
    const ingredients = cloneFixture(fixtureIngredients).map(ingredient =>
      ingredient.id === 'ing-milk'
        ? {
            ...ingredient,
            stock: 11000,
            costPerUnit: 20,
            priceHistory: [{ date: '2026-06-27T09:00:00.000Z', price: 20 }],
          }
        : ingredient,
    );
    const expense: Expense = {
      id: 'expense-purchase-1',
      category: 'PURCHASE',
      amount: 20000,
      date: '2026-06-27T09:00:00.000Z',
      description: 'Restock Susu Segar',
      source: 'CASH_DRAWER',
      purchaseMetadata: {
        ingredientId: 'ing-milk',
        addedStock: 1000,
        previousHpp: 15,
        previousPriceHistory: [],
      },
    };

    const updated = rollbackPurchase(ingredients, expense);

    expect(updated.find(i => i.id === 'ing-milk')?.stock).toBe(10000);
    expect(updated.find(i => i.id === 'ing-milk')?.costPerUnit).toBe(15);
    expect(updated.find(i => i.id === 'ing-milk')?.priceHistory).toEqual([]);
  });
});

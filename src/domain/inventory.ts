import { CartItem, Expense, Ingredient } from '../../types';

export type StockValidationResult = { ok: true } | { ok: false; message: string };

export function validateStockAvailability(
  ingredients: Ingredient[],
  cart: CartItem[],
): StockValidationResult {
  for (const item of cart) {
    for (const recipeItem of item.product.recipe || []) {
      const required = recipeItem.amount * item.quantity;
      const ingredient = ingredients.find(candidate => candidate.id === recipeItem.ingredientId);

      if (!ingredient || ingredient.stock < required) {
        return {
          ok: false,
          message: `Stok tidak cukup untuk ${item.product.name} (Bahan: ${ingredient?.name || 'Unknown'})`,
        };
      }
    }

    for (const modifier of item.modifiers) {
      for (const recipeItem of modifier.recipeAdjustment || []) {
        const required = recipeItem.amount * item.quantity;
        const ingredient = ingredients.find(candidate => candidate.id === recipeItem.ingredientId);

        if (!ingredient || ingredient.stock < required) {
          return {
            ok: false,
            message: `Stok tidak cukup untuk Modifier ${modifier.name} (Bahan: ${ingredient?.name || 'Unknown'})`,
          };
        }
      }
    }
  }

  return { ok: true };
}

export function applyStockDeduction(ingredients: Ingredient[], cart: CartItem[]): Ingredient[] {
  return applyStockDelta(ingredients, cart, -1);
}

export function rollbackStockDeduction(ingredients: Ingredient[], cart: CartItem[]): Ingredient[] {
  return applyStockDelta(ingredients, cart, 1);
}

export function calculateAverageCost(input: {
  currentStock: number;
  currentCostPerUnit: number;
  addedUsageQty: number;
  purchaseCostPerUsageUnit: number;
}): number {
  const { currentStock, currentCostPerUnit, addedUsageQty, purchaseCostPerUsageUnit } = input;
  const newStock = currentStock + addedUsageQty;

  if (newStock <= 0) return 0;

  const oldTotalValue = currentStock * currentCostPerUnit;
  const newTotalValue = addedUsageQty * purchaseCostPerUsageUnit;

  return (oldTotalValue + newTotalValue) / newStock;
}

export function isPriceAnomaly(
  oldCost: number,
  newCost: number,
  thresholdPercent = 20,
): boolean {
  if (oldCost <= 0) return false;
  return Math.abs((newCost - oldCost) / oldCost) * 100 > thresholdPercent;
}

export function rollbackPurchase(ingredients: Ingredient[], expense: Expense): Ingredient[] {
  if (!expense.purchaseMetadata) return ingredients;

  const { ingredientId, addedStock, previousHpp, previousPriceHistory } = expense.purchaseMetadata;

  return ingredients.map(ingredient => {
    if (ingredient.id !== ingredientId) return ingredient;

    return {
      ...ingredient,
      stock: Math.max(0, ingredient.stock - addedStock),
      costPerUnit: previousHpp,
      priceHistory: previousPriceHistory,
    };
  });
}

function applyStockDelta(ingredients: Ingredient[], cart: CartItem[], direction: 1 | -1): Ingredient[] {
  const updatedIngredients = ingredients.map(ingredient => ({ ...ingredient }));

  for (const item of cart) {
    for (const recipeItem of item.product.recipe || []) {
      updateIngredientStock(updatedIngredients, recipeItem.ingredientId, direction * recipeItem.amount * item.quantity);
    }

    for (const modifier of item.modifiers) {
      for (const recipeItem of modifier.recipeAdjustment || []) {
        updateIngredientStock(updatedIngredients, recipeItem.ingredientId, direction * recipeItem.amount * item.quantity);
      }
    }
  }

  return updatedIngredients;
}

function updateIngredientStock(
  ingredients: Ingredient[],
  ingredientId: string,
  stockDelta: number,
): void {
  const ingredient = ingredients.find(candidate => candidate.id === ingredientId);
  if (!ingredient) return;

  ingredient.stock += stockDelta;
}

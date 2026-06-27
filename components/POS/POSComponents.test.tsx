import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProductCategory } from '../../types';
import { fixtureProducts } from '../../src/domain/__tests__/fixtures';
import { ProductGrid } from './ProductGrid';
import { ShiftModal } from './ShiftModal';

describe('POS split components', () => {
  it('renders filtered product cards and calls product selection', () => {
    const onProductClick = vi.fn();

    render(
      <ProductGrid
        products={[fixtureProducts.coffee, fixtureProducts.food]}
        selectedCategory={ProductCategory.COFFEE}
        menuSearch=""
        formatRupiah={value => `Rp ${value}`}
        onProductClick={onProductClick}
      />,
    );

    expect(screen.getByText(fixtureProducts.coffee.name)).toBeInTheDocument();
    expect(screen.queryByText(fixtureProducts.food.name)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(fixtureProducts.coffee.name));

    expect(onProductClick).toHaveBeenCalledWith(fixtureProducts.coffee);
  });

  it('renders shift modal and triggers open shift action', () => {
    const onOpenShift = vi.fn();

    render(
      <ShiftModal
        startCash="100.000"
        onStartCashChange={vi.fn()}
        onOpenShift={onOpenShift}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getByText('Mulai Shift')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Buka Shift'));

    expect(onOpenShift).toHaveBeenCalledOnce();
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, describe, beforeEach } from 'vitest';
import App from '../App';
import { PRODUCTS, USERS, CATEGORIES, INGREDIENTS } from '../constants';

vi.mock('@vladmandic/face-api', () => ({
  nets: {
    ssdMobilenetv1: { loadFromUri: vi.fn() },
    faceLandmark68Net: { loadFromUri: vi.fn() },
    faceRecognitionNet: { loadFromUri: vi.fn() },
  },
  detectSingleFace: vi.fn(),
  fetchImage: vi.fn(),
}));

describe('Cashier Integration Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    
    // Mock window.alert
    global.alert = vi.fn();
    
    // Mock fetch for API calls
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/sync') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            timestamp: Date.now(),
            products: PRODUCTS,
            users: USERS,
            categories: CATEGORIES,
            ingredients: INGREDIENTS
          })
        });
      }
      if (url === '/api/orders') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  test('Jalanan unit test local - Cashier Full Flow', async () => {
    const { unmount } = render(<App />);

    // 1. Login with cashier pin: 333333
    await waitFor(() => {
      expect(screen.getByText(/Masukkan PIN/i)).toBeInTheDocument();
    });

    // Assume there is a keypad with numbers 3
    const btn3 = screen.getByText('3');
    for(let i = 0; i < 6; i++) {
      fireEvent.click(btn3);
    }
    const btnMasuk = screen.getByText('MASUK');
    fireEvent.click(btnMasuk);
    
    // 2. Clock in and Open Kasir
    await waitFor(() => {
      expect(screen.getByText(/CLOCK IN & MASUK POS/i)).toBeInTheDocument();
    });
    
    const clockInBtn = screen.getByText(/CLOCK IN & MASUK POS/i);
    fireEvent.click(clockInBtn);

    await waitFor(() => {
      expect(screen.getByText(/Mulai Shift/i)).toBeInTheDocument();
    });

    const inputCash = screen.getByPlaceholderText(/0/i);
    fireEvent.change(inputCash, { target: { value: '250000' } });

    const btnBukaKasir = screen.getByText('Buka Shift');
    fireEvent.click(btnBukaKasir);

    // Wait for POS View
    await waitFor(() => {
      expect(screen.getByText(/Kopi Susu Gula Aren/i)).toBeInTheDocument();
    });

    // 3. Input transaksi, lebih dari 1 item
    const product1 = screen.getByText(/Kopi Susu Gula Aren/i);
    const product2 = screen.getByText(/Kopi Susu/i); // Example product
    fireEvent.click(product1);
    
    try {
      fireEvent.click(product2);
    } catch(e) {
      // if Kopi Susu is not found, click product 1 again
      fireEvent.click(product1);
    }
    // Wait for it to be added to cart (check if total changed from Rp 0 to something else)
    await waitFor(() => {
        expect(screen.queryByText('Rp 0')).not.toBeInTheDocument();
    });

    // 5. Nomor pager 10
    const pagerInput = screen.getAllByRole('textbox').find(el => !el.getAttribute('placeholder') || !el.getAttribute('placeholder')!.includes('Cari'));
    if (!pagerInput) throw new Error('Pager input not found');
    fireEvent.change(pagerInput, { target: { value: '10' } });

    // Wait for the pager to be set and Bayar button to be enabled
    const btnBayarSpan = screen.getByText(/Bayar/i);
    const btnBayar = btnBayarSpan.closest('button');
    if (!btnBayar) throw new Error('Bayar button not found');

    await waitFor(() => {
        expect(btnBayar).not.toBeDisabled();
    });

    // Click Bayar
    fireEvent.click(btnBayar);

    // Wait for Payment Modal to appear
    await waitFor(() => {
        expect(screen.getByText(/Tunai/i)).toBeInTheDocument();
    });

    // Choose Cash payment method
    const cashSpan = screen.getByText(/Tunai/i);
    const btn = cashSpan.closest('button');
    if (btn) fireEvent.click(btn);

    // Wait for modal transition/render if any
    await waitFor(() => {
        expect(screen.getByText('Uang Pas')).toBeInTheDocument();
    });

    // Submit Payment
    const uangPas = screen.getByText(/Uang Pas/i);
    fireEvent.click(uangPas);

    // Wait for the button to become enabled
    const btnBayarSekarang = screen.getByText(/BAYAR SEKARANG/i).closest('button');
    if (!btnBayarSekarang) throw new Error('BAYAR SEKARANG button not found');
    
    await waitFor(() => {
        expect(btnBayarSekarang).not.toBeDisabled();
    });

    fireEvent.click(btnBayarSekarang);

    // 6. Pastikan transaksi tersimpan ke dalam database (check if API was called)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/orders', expect.objectContaining({
        method: 'POST'
      }));
    });

    // Verify order payload contains pagerNumber 10
    const fetchCall = vi.mocked(global.fetch).mock.calls.find(c => c[0] === '/api/orders');
    expect(fetchCall).toBeDefined();
    if(fetchCall && fetchCall[1]) {
        const body = JSON.parse(fetchCall[1].body as string);
        expect(body.pagerNumber).toBe('10');
        expect(body.paymentMethod).toBe('CASH');
    }

    // 7. Refresh and verify no re-login or re-input cash needed
    unmount();
    
    // Remount App
    render(<App />);

    // Because it's stored in localStorage, we should NOT see PIN login
    // and we should NOT see "Mulai Shift" / "Buka Kasir"
    await waitFor(() => {
      expect(screen.queryByText(/Masukan PIN/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Mulai Shift/i)).not.toBeInTheDocument();
      // Should directly see POS products
      expect(screen.getByText(/Kopi Susu Gula Aren/i)).toBeInTheDocument();
    });

  });
});

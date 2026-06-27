import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, describe, beforeEach } from 'vitest';
import App from '../App';
import { PRODUCTS, USERS, CATEGORIES, INGREDIENTS } from '../constants';

// Mock face-api to avoid canvas errors
vi.mock('@vladmandic/face-api', () => ({
  nets: {
    ssdMobilenetv1: { loadFromUri: vi.fn() },
    faceLandmark68Net: { loadFromUri: vi.fn() },
    faceRecognitionNet: { loadFromUri: vi.fn() },
  },
  detectSingleFace: vi.fn(),
  fetchImage: vi.fn(),
}));

describe('Barista/Kitchen Integration Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    
    // Mock window.alert and window.AudioContext
    global.alert = vi.fn();
    (global as any).window.AudioContext = vi.fn().mockImplementation(() => ({
      createOscillator: vi.fn(() => ({
        connect: vi.fn(),
        frequency: { setValueAtTime: vi.fn() },
        start: vi.fn(),
        stop: vi.fn(),
        type: 'sawtooth'
      })),
      createGain: vi.fn(() => ({
        connect: vi.fn(),
        gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }
      })),
      destination: {},
      currentTime: 0
    }));
    
    // Mock fetch for API calls
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/sync') {
        // Mock a pending order that was created by the Cashier
        const mockOrder = {
          id: 'ORD-TEST-123',
          pagerNumber: '10',
          items: [
            {
              tempId: 'temp-1',
              product: PRODUCTS[0], // Kopi Susu Gula Aren
              quantity: 2,
              price: 25000,
              modifiers: [],
              notes: 'Kurang manis',
              completed: false
            }
          ],
          totalAmount: 50000,
          finalAmount: 50000,
          discountApplied: 0,
          pointsEarned: 50,
          pointsRedeemed: 0,
          promoCode: '',
          memberId: undefined,
          customerName: 'Guest',
          status: 'PREPARING',
          paymentStatus: 'PAID',
          paidAt: new Date().toISOString(),
          baristaStatus: 'PREPARING',
          kitchenStatus: 'IDLE',
          baristaStartTime: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          paymentMethod: 'CASH',
          cashierName: 'Kasir Andi',
          cashReceived: 50000,
          change: 0
        };

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            timestamp: Date.now(),
            products: PRODUCTS,
            users: USERS,
            categories: CATEGORIES,
            ingredients: INGREDIENTS,
            orders: [mockOrder]
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  test('Jalanan unit test local - Barista Flow', async () => {
    const { unmount } = render(<App />);

    // 1. Login with Barista pin: 444444
    await waitFor(() => {
        expect(screen.getByText(/Masukkan PIN/i)).toBeInTheDocument();
    });

    // We can simulate PIN entry by clicking the keypad, but for this test, we can just find the input or click buttons
    const pinBtns = ['4', '4', '4', '4', '4', '4'];
    for (const num of pinBtns) {
        const btn = screen.getByText(num);
        fireEvent.click(btn);
    }

    const btnMasuk = screen.getByRole('button', { name: /Masuk/i });
    fireEvent.click(btnMasuk);

    // 2. Wait for login to complete and see the Clock In screen
    await waitFor(() => {
        expect(screen.getByText(/Barista John/i)).toBeInTheDocument();
        expect(screen.getByText(/CLOCK IN & MASUK POS/i)).toBeInTheDocument();
    });

    const btnClockIn = screen.getByText(/CLOCK IN & MASUK POS/i);
    fireEvent.click(btnClockIn);

    // 2b. Verify we are in KDS View and order from previous test is visible
    await waitFor(() => {
        expect(screen.getByText(/Kopi Susu Gula Aren/i)).toBeInTheDocument();
    });

    // 3. Ensure NO "Buka Kasir" modal is displayed
    // Buka Shift modal has text like "Buka Shift" or "Saldo Awal Kasir"
    expect(screen.queryByText(/Buka Shift/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Saldo Awal Kasir/i)).not.toBeInTheDocument();

    // 4. Serta lakukan refresh dan pastikan ketika refresh tidak harus login ulang pin kasir dan menginput dana awal kasir
    unmount(); // Simulate refresh by unmounting and remounting

    const { unmount: unmount2 } = render(<App />);

    // Wait and check if we are directly inside KDS View without login screen
    await waitFor(() => {
        expect(screen.queryByPlaceholderText(/Masukkan PIN/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Barista John/i)).toBeInTheDocument();
        expect(screen.getByText(/Kopi Susu Gula Aren/i)).toBeInTheDocument();
    });

    unmount2();
  });
});

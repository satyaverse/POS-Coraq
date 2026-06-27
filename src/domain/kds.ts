import { CartItem, Order, OrderStatus, Role, StationStatus } from '../../types';

export type StationRole = 'BARISTA' | 'KITCHEN';

const ACTIVE_KDS_STATUSES: StationStatus[] = ['PENDING', 'PREPARING'];

export function getStationForCategory(category: string): StationRole | null {
  if (category.includes('COFFEE') || category.includes('NON_COFFEE')) return 'BARISTA';
  if (category.includes('FOOD') || category.includes('DESSERT')) return 'KITCHEN';
  return null;
}

export function getItemsForStation(order: Order, role: Role): CartItem[] {
  return order.items.filter(item => {
    const station = getStationForCategory(item.product.category);
    if (role === Role.BARISTA) return station === 'BARISTA';
    if (role === Role.KITCHEN) return station === 'KITCHEN';
    return false;
  });
}

export function getInitialStationStatuses(
  cart: CartItem[],
  status: OrderStatus = OrderStatus.PREPARING,
): { baristaStatus: StationStatus; kitchenStatus: StationStatus } {
  if (status === OrderStatus.PENDING) {
    return { baristaStatus: 'IDLE', kitchenStatus: 'IDLE' };
  }

  const hasBaristaItems = cart.some(item => getStationForCategory(item.product.category) === 'BARISTA');
  const hasKitchenItems = cart.some(item => getStationForCategory(item.product.category) === 'KITCHEN');

  return {
    baristaStatus: hasBaristaItems ? 'PREPARING' : 'IDLE',
    kitchenStatus: hasKitchenItems ? 'PREPARING' : 'IDLE',
  };
}

export function getStationStatus(order: Order, role: Role): StationStatus {
  return role === Role.BARISTA ? order.baristaStatus : order.kitchenStatus;
}

export function resolveGlobalOrderStatus(order: Order): OrderStatus {
  const activeStatuses = [order.baristaStatus, order.kitchenStatus].filter(status => status !== 'IDLE');

  if (activeStatuses.length === 0) return order.status;
  if (activeStatuses.every(status => status === 'COMPLETED')) return OrderStatus.COMPLETED;
  if (activeStatuses.every(status => status === 'READY' || status === 'COMPLETED')) return OrderStatus.READY;

  return order.status;
}

export function filterOrdersForStation(orders: Order[], role: Role): Order[] {
  return orders.filter(order => ACTIVE_KDS_STATUSES.includes(getStationStatus(order, role)));
}

export function getStationDeadline(order: Order, role: Role): number {
  const totalPrepTimeMinutes = getItemsForStation(order, role).reduce((total, item) => {
    return total + ((item.product.standardPrepTime || 5) * item.quantity);
  }, 0);

  return new Date(order.createdAt).getTime() + (totalPrepTimeMinutes * 60 * 1000);
}

export function sortOrdersByDeadline(orders: Order[], role: Role): Order[] {
  return [...orders].sort((a, b) => getStationDeadline(a, role) - getStationDeadline(b, role));
}

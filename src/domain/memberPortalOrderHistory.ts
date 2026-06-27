import { Order, OrderStatus } from '../../types';

export function getMemberOrderHistory(orders: Order[], memberId: string): Order[] {
  return orders
    .filter(order => order.memberId === memberId && order.status === OrderStatus.COMPLETED)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

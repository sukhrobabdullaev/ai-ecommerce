import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Order, OrderStatus, PaymentStatus } from "@/types";

interface OrderStore {
  orders: Order[];
  currentOrder: Order | null;

  // Actions
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  getOrderById: (orderId: string) => Order | null;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  clearOrders: () => void;

  // Computed
  getTotalOrders: () => number;
  getTotalSpent: () => number;
  getRecentOrders: (limit?: number) => Order[];
}

// Mock orders data for demonstration
const mockOrders: Order[] = [
  {
    id: "order_001",
    userId: "1",
    orderNumber: "123456",
    status: OrderStatus.DELIVERED,
    subtotal: 199.99,
    tax: 16.0,
    shipping: 0.0,
    total: 215.99,
    shippingAddress: {
      firstName: "John",
      lastName: "Doe",
      address: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "US",
    },
    billingAddress: {
      firstName: "John",
      lastName: "Doe",
      address: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "US",
    },
    paymentMethod: "card",
    paymentStatus: PaymentStatus.COMPLETED,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    items: [
      {
        id: "item_001",
        orderId: "order_001",
        productId: "1",
        quantity: 1,
        price: 199.99,
        createdAt: new Date("2024-01-15"),
        product: {
          id: "1",
          name: "Wireless Bluetooth Headphones",
          description: "Premium noise-canceling wireless headphones",
          price: 199.99,
          category: "Electronics",
          brand: "AudioTech",
          images: [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
          ],
          tags: ["wireless", "bluetooth", "noise-canceling"],
          stock: 25,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      },
    ],
  },
  {
    id: "order_002",
    userId: "1",
    orderNumber: "123457",
    status: OrderStatus.SHIPPED,
    subtotal: 149.99,
    tax: 12.0,
    shipping: 9.99,
    total: 171.98,
    shippingAddress: {
      firstName: "John",
      lastName: "Doe",
      address: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "US",
    },
    billingAddress: {
      firstName: "John",
      lastName: "Doe",
      address: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "US",
    },
    paymentMethod: "card",
    paymentStatus: PaymentStatus.COMPLETED,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-22"),
    items: [
      {
        id: "item_002",
        orderId: "order_002",
        productId: "3",
        quantity: 1,
        price: 149.99,
        createdAt: new Date("2024-01-20"),
        product: {
          id: "3",
          name: "Gaming Mechanical Keyboard",
          description: "RGB backlit mechanical gaming keyboard",
          price: 149.99,
          category: "Gaming",
          brand: "GameGear",
          images: [
            "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400",
          ],
          tags: ["gaming", "mechanical", "rgb"],
          stock: 30,
          createdAt: new Date("2024-01-03"),
          updatedAt: new Date("2024-01-03"),
        },
      },
    ],
  },
  {
    id: "order_003",
    userId: "1",
    orderNumber: "123458",
    status: OrderStatus.PROCESSING,
    subtotal: 299.99,
    tax: 24.0,
    shipping: 0.0,
    total: 323.99,
    shippingAddress: {
      firstName: "John",
      lastName: "Doe",
      address: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "US",
    },
    billingAddress: {
      firstName: "John",
      lastName: "Doe",
      address: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "US",
    },
    paymentMethod: "card",
    paymentStatus: PaymentStatus.COMPLETED,
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
    items: [
      {
        id: "item_003",
        orderId: "order_003",
        productId: "2",
        quantity: 1,
        price: 299.99,
        createdAt: new Date("2024-01-25"),
        product: {
          id: "2",
          name: "Smart Fitness Watch",
          description: "Advanced fitness tracker with heart rate monitoring",
          price: 299.99,
          category: "Wearables",
          brand: "FitTech",
          images: [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
          ],
          tags: ["smartwatch", "fitness", "gps"],
          stock: 15,
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
        },
      },
    ],
  },
];

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: mockOrders,
      currentOrder: null,

      addOrder: (order: Order) => {
        set((state) => ({
          orders: [order, ...state.orders],
        }));
      },

      updateOrderStatus: (orderId: string, status: OrderStatus) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? { ...order, status, updatedAt: new Date() }
              : order
          ),
        }));
      },

      updatePaymentStatus: (orderId: string, status: PaymentStatus) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? { ...order, paymentStatus: status, updatedAt: new Date() }
              : order
          ),
        }));
      },

      getOrderById: (orderId: string) => {
        return get().orders.find((order) => order.id === orderId) || null;
      },

      getOrdersByStatus: (status: OrderStatus) => {
        return get().orders.filter((order) => order.status === status);
      },

      clearOrders: () => {
        set({ orders: [] });
      },

      getTotalOrders: () => {
        return get().orders.length;
      },

      getTotalSpent: () => {
        return get()
          .orders.filter(
            (order) => order.paymentStatus === PaymentStatus.COMPLETED
          )
          .reduce((total, order) => total + order.total, 0);
      },

      getRecentOrders: (limit = 5) => {
        return get()
          .orders.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, limit);
      },
    }),
    {
      name: "order-storage",
      partialize: (state) => ({ orders: state.orders }),
    }
  )
);

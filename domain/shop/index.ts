// domain/shop/index.ts

export {
  ORDER_STATUS_PENDING,
  ORDER_STATUS_AWAITING_PAYMENT,
  ORDER_STATUS_PAID,
  ORDER_STATUS_SHIPPED,
  ORDER_STATUS_DELIVERED,
  ORDER_STATUS_CANCELLED,
  ORDER_PAYMENT_PROVIDER_STRIPE,
  ORDER_PAYMENT_STATUS_OPEN,
  ORDER_PAYMENT_STATUS_PAID,
  ORDER_PAYMENT_STATUS_FAILED,
  ORDER_PAYMENT_STATUS_EXPIRED,
  ORDER_PAYMENT_STATUS_REFUNDED,
  ORDER_WITH_ITEMS_QUERY,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  createPublicOrder,
  getOrderWithItemsById,
  attachStripePaymentSessionToOrder,
  markOrderPaidByPaymentSession,
  cancelOpenOrderPayment,
  cancelOpenOrderPaymentBySession,
  serializeOrderWithItems,
  type CheckoutSessionResult,
  type Product,
  type ProductCreateInput,
  type ProductUpdateInput,
  type ProductListParams,
  type ProductListResult,
  type OrderItemInput,
  type PublicOrderCreateInput,
  type SerializedOrder,
  type SerializedOrderItem,
} from "./services";

export {
  sendOrderCreatedNotifications,
  sendOrderStatusChangedNotifications,
} from "./notifications";

export {
  createStripeCheckout,
  handleStripeCheckoutPaid,
  handleStripeCheckoutFailed,
  handleStripeCheckoutExpired,
  isAwaitingStripePayment,
} from "./payments";

// domain/shop/index.ts

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  createPublicOrder,
  serializeOrderWithItems,
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

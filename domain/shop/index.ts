// domain/shop/index.ts

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  createOrder,
  type Product,
  type ProductCreateInput,
  type ProductUpdateInput,
  type ProductListParams,
  type ProductListResult,
  type OrderItemInput,
  type OrderCreateInput,
} from "./services";

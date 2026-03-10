import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerSessionMock,
  getProductsMock,
  createProductMock,
  getProductByIdMock,
  updateProductMock,
  deleteProductMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  getProductsMock: vi.fn(),
  createProductMock: vi.fn(),
  getProductByIdMock: vi.fn(),
  updateProductMock: vi.fn(),
  deleteProductMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/domain/shop/services", () => ({
  getProducts: getProductsMock,
  createProduct: createProductMock,
  getProductById: getProductByIdMock,
  updateProduct: updateProductMock,
  deleteProduct: deleteProductMock,
}));

import { POST as createProductRoute } from "@/app/api/shop/products/route";
import { PUT as updateProductRoute } from "@/app/api/shop/products/[id]/route";

describe("product admin routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "seller-1",
      },
    });
  });

  it("creates products with numeric editor values", async () => {
    createProductMock.mockResolvedValue({
      id: "product-1",
      name: "Poster",
      price: 2500,
      stock: 8,
    });

    const response = await createProductRoute(
      new Request("http://localhost/api/shop/products", {
        method: "POST",
        body: JSON.stringify({
          name: "Poster",
          description: "Signed",
          price: "2500",
          stock: "8",
          images: ["/uploads/poster.jpg"],
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(createProductMock).toHaveBeenCalledWith({
      userId: "seller-1",
      name: "Poster",
      description: "Signed",
      price: 2500,
      stock: 8,
      images: ["/uploads/poster.jpg"],
      status: "DRAFT",
    });
    expect(payload.product).toMatchObject({
      id: "product-1",
      name: "Poster",
    });
  });

  it("rejects product updates when images is not an array", async () => {
    const response = await updateProductRoute(
      new Request("http://localhost/api/shop/products/product-1", {
        method: "PUT",
        body: JSON.stringify({
          images: "/uploads/poster.jpg",
        }),
      }),
      {
        params: Promise.resolve({ id: "product-1" }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("images must be an array");
    expect(updateProductMock).not.toHaveBeenCalled();
  });

  it("updates products with coerced numeric fields", async () => {
    updateProductMock.mockResolvedValue({
      id: "product-1",
      name: "Poster",
      price: 3200,
      stock: 3,
    });

    const response = await updateProductRoute(
      new Request("http://localhost/api/shop/products/product-1", {
        method: "PUT",
        body: JSON.stringify({
          price: "3200",
          stock: "3",
          status: "PUBLISHED",
        }),
      }),
      {
        params: Promise.resolve({ id: "product-1" }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(updateProductMock).toHaveBeenCalledWith("product-1", "seller-1", {
      price: 3200,
      stock: 3,
      status: "PUBLISHED",
    });
    expect(payload.product).toMatchObject({
      id: "product-1",
      price: 3200,
    });
  });
});

import { expect, test } from "@playwright/test";
import {
  bootstrapAdminE2E,
  createProduct,
  createPublicPageState,
  createSerializedOrder,
  fulfillJson,
  mockCurrentUser,
  setPublicSiteState,
} from "./utils/admin";

function buildHostedCheckoutUrl(options: {
  successPath: string;
  cancelPath: string;
  sessionId: string;
}) {
  const params = new URLSearchParams({
    success: options.successPath,
    cancel: options.cancelPath,
    session_id: options.sessionId,
  });

  return `/test/stripe-hosted?${params.toString()}`;
}

test.beforeEach(async ({ context, page }) => {
  await bootstrapAdminE2E(context, page);
  await mockCurrentUser(page);
});

test("returns from hosted checkout success to the order success page", async ({
  context,
  page,
}) => {
  const checkoutRequests: Array<Record<string, unknown>> = [];
  let orderLookupCount = 0;

  const product = createProduct({
    id: "product-checkout-e2e",
    name: "Birthday voice pack",
    description: "A limited voice pack with handwritten postcard art.",
    price: 2800,
    stock: 5,
    images: ["/hero/2.jpeg"],
  });

  await setPublicSiteState(context, {
    pages: [
      createPublicPageState({
        products: [product],
      }),
    ],
    blogFeed: [],
    shopCatalog: [product],
  });

  await page.route("**/api/shop/products/product-checkout-e2e", async (route) => {
    await fulfillJson(route, {
      product: {
        ...product,
        userId: "user-1",
        createdAt: "2026-03-11T00:00:00.000Z",
        updatedAt: "2026-03-11T00:00:00.000Z",
      },
    });
  });

  await page.route("**/api/shop/checkout", async (route) => {
    checkoutRequests.push(route.request().postDataJSON() as Record<string, unknown>);

    await fulfillJson(route, {
      checkout: {
        orderId: "order-checkout-e2e",
        provider: "STRIPE",
        checkoutUrl: buildHostedCheckoutUrl({
          successPath:
            "/u/creator/shop/order-success/order-checkout-e2e?session_id=cs_test_checkout_e2e",
          cancelPath: "/u/creator/shop/product-checkout-e2e",
          sessionId: "cs_test_checkout_e2e",
        }),
        expiresAt: "2026-03-11T02:00:00.000Z",
      },
    });
  });

  await page.route(
    "**/api/shop/orders/order-checkout-e2e?*",
    async (route) => {
      orderLookupCount += 1;

      if (orderLookupCount === 1) {
        await fulfillJson(route, {
          order: createSerializedOrder({
            id: "order-checkout-e2e",
            buyerEmail: "buyer@example.com",
            totalAmount: 2800,
            refundableAmount: 2800,
            status: "AWAITING_PAYMENT",
            paymentStatus: "OPEN",
            paymentSessionId: "cs_test_checkout_e2e",
            paymentIntentId: null,
            paidAt: null,
            items: [
              {
                id: "item-checkout-e2e",
                orderId: "order-checkout-e2e",
                productId: product.id,
                quantity: 1,
                price: 2800,
                subtotal: 2800,
                createdAt: "2026-03-11T00:00:00.000Z",
                product: {
                  id: product.id,
                  name: product.name,
                  images: product.images,
                },
              },
            ],
            paymentAttempts: [
              {
                id: "attempt-checkout-e2e-open",
                orderId: "order-checkout-e2e",
                provider: "STRIPE",
                status: "OPEN",
                amount: 2800,
                currency: "JPY",
                externalSessionId: "cs_test_checkout_e2e",
                externalPaymentIntentId: null,
                failureReason: null,
                metadata: null,
                createdAt: "2026-03-11T00:00:00.000Z",
                updatedAt: "2026-03-11T00:00:00.000Z",
                paidAt: null,
                failedAt: null,
                expiredAt: null,
              },
            ],
          }),
        });
        return;
      }

      await fulfillJson(route, {
        order: createSerializedOrder({
          id: "order-checkout-e2e",
          buyerEmail: "buyer@example.com",
          totalAmount: 2800,
          refundableAmount: 2800,
          status: "PAID",
          paymentStatus: "PAID",
          paymentSessionId: "cs_test_checkout_e2e",
          paymentIntentId: "pi_test_checkout_e2e",
          paidAt: "2026-03-11T00:02:00.000Z",
          items: [
            {
              id: "item-checkout-e2e",
              orderId: "order-checkout-e2e",
              productId: product.id,
              quantity: 1,
              price: 2800,
              subtotal: 2800,
              createdAt: "2026-03-11T00:00:00.000Z",
              product: {
                id: product.id,
                name: product.name,
                images: product.images,
              },
            },
          ],
        }),
      });
    }
  );

  await page.route(
    "**/api/shop/orders/order-checkout-e2e/confirm",
    async (route) => {
      await fulfillJson(route, {
        order: createSerializedOrder({
          id: "order-checkout-e2e",
          buyerEmail: "buyer@example.com",
          totalAmount: 2800,
          refundableAmount: 2800,
          status: "PAID",
          paymentStatus: "PAID",
          paymentSessionId: "cs_test_checkout_e2e",
          paymentIntentId: "pi_test_checkout_e2e",
          paidAt: "2026-03-11T00:02:00.000Z",
          items: [
            {
              id: "item-checkout-e2e",
              orderId: "order-checkout-e2e",
              productId: product.id,
              quantity: 1,
              price: 2800,
              subtotal: 2800,
              createdAt: "2026-03-11T00:00:00.000Z",
              product: {
                id: product.id,
                name: product.name,
                images: product.images,
              },
            },
          ],
        }),
      });
    }
  );

  await page.goto("/u/creator/shop/product-checkout-e2e");

  await expect(page.getByTestId("public-user-shop-detail")).toBeVisible();
  await page.getByTestId("public-shop-buy-now").click();

  await expect(page.getByTestId("public-shop-checkout-page")).toBeVisible();
  await page.getByTestId("checkout-buyer-email").fill("buyer@example.com");
  await page.getByTestId("checkout-submit").click();

  await expect(page.getByTestId("stripe-hosted-checkout-page")).toBeVisible();
  await page.getByTestId("stripe-hosted-success").click();

  await expect(page).toHaveURL(
    /\/u\/creator\/shop\/order-success\/order-checkout-e2e\?session_id=cs_test_checkout_e2e$/
  );
  await expect(page.getByTestId("public-shop-order-success-page")).toBeVisible();
  await expect(page.getByTestId("public-shop-order-status-title")).toHaveText(
    "支付结果确认中"
  );
  await expect(page.getByTestId("public-shop-order-status-title")).toHaveText(
    "订单已支付",
    { timeout: 12_000 }
  );
  await expect(page.getByTestId("public-shop-order-buyer-card")).toContainText(
    "buyer@example.com"
  );

  expect(checkoutRequests[0]).toEqual({
    buyerEmail: "buyer@example.com",
    buyerName: null,
    shippingAddress: null,
    shippingMethod: "Standard",
    items: [{ productId: "product-checkout-e2e", quantity: 1 }],
  });
  expect(orderLookupCount).toBeGreaterThanOrEqual(1);
});

test("returns from hosted checkout cancel to the product detail page", async ({
  context,
  page,
}) => {
  const checkoutRequests: Array<Record<string, unknown>> = [];

  const product = createProduct({
    id: "product-checkout-cancel-e2e",
    name: "Tour final badge set",
    description: "A metal badge set for the tour final key visual.",
    price: 3600,
    stock: 9,
    images: ["/hero/3.jpeg"],
  });

  await setPublicSiteState(context, {
    pages: [
      createPublicPageState({
        products: [product],
      }),
    ],
    blogFeed: [],
    shopCatalog: [product],
  });

  await page.route(
    "**/api/shop/products/product-checkout-cancel-e2e",
    async (route) => {
      await fulfillJson(route, {
        product: {
          ...product,
          userId: "user-1",
          createdAt: "2026-03-11T00:00:00.000Z",
          updatedAt: "2026-03-11T00:00:00.000Z",
        },
      });
    }
  );

  await page.route("**/api/shop/checkout", async (route) => {
    checkoutRequests.push(route.request().postDataJSON() as Record<string, unknown>);

    await fulfillJson(route, {
      checkout: {
        orderId: "order-checkout-cancel-e2e",
        provider: "STRIPE",
        checkoutUrl: buildHostedCheckoutUrl({
          successPath:
            "/u/creator/shop/order-success/order-checkout-cancel-e2e?session_id=cs_test_checkout_cancel_e2e",
          cancelPath: "/u/creator/shop/product-checkout-cancel-e2e",
          sessionId: "cs_test_checkout_cancel_e2e",
        }),
        expiresAt: "2026-03-11T02:00:00.000Z",
      },
    });
  });

  await page.goto("/u/creator/shop/product-checkout-cancel-e2e");

  await expect(page.getByTestId("public-user-shop-detail")).toBeVisible();
  await page.getByTestId("public-shop-buy-now").click();

  await expect(page.getByTestId("public-shop-checkout-page")).toBeVisible();
  await page.getByTestId("checkout-buyer-email").fill("buyer@example.com");
  await page.getByTestId("checkout-submit").click();

  await expect(page.getByTestId("stripe-hosted-checkout-page")).toBeVisible();
  await page.getByTestId("stripe-hosted-cancel").click();

  await expect(page).toHaveURL(/\/u\/creator\/shop\/product-checkout-cancel-e2e$/);
  await expect(page.getByTestId("public-user-shop-detail-title")).toHaveText(
    "Tour final badge set"
  );
  await expect(page.getByTestId("public-shop-buy-now")).toBeVisible();

  expect(checkoutRequests[0]).toEqual({
    buyerEmail: "buyer@example.com",
    buyerName: null,
    shippingAddress: null,
    shippingMethod: "Standard",
    items: [{ productId: "product-checkout-cancel-e2e", quantity: 1 }],
  });
});

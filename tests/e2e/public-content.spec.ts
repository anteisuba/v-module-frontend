import { expect, test } from "@playwright/test";
import {
  bootstrapAdminE2E,
  createBlogPost,
  createNewsArticle,
  createPageConfig,
  createProduct,
  createPublicPageState,
  fulfillJson,
  mockCurrentUser,
  setPublicSiteState,
} from "./utils/admin";

async function getDirectBackgroundImage(page: import("@playwright/test").Page, testId: string) {
  return page.getByTestId(testId).evaluate((element) => {
    const layer = element.firstElementChild;
    if (!(layer instanceof HTMLElement)) {
      return "";
    }
    return getComputedStyle(layer).backgroundImage;
  });
}

test.beforeEach(async ({ context, page }) => {
  await bootstrapAdminE2E(context, page);
  await mockCurrentUser(page);
});

test("renders public blog entry and creator detail pages", async ({
  context,
  page,
}) => {
  const blogPost = createBlogPost({
    id: "post-e2e-1",
    title: "Spring live behind the scenes",
    content: "Set list notes, rehearsal photos, and post-show reflections.",
    coverImage: "/hero/3.jpeg",
    comments: [
      {
        id: "comment-1",
        blogPostId: "post-e2e-1",
        userName: "Mika",
        userEmail: null,
        content: "The encore section was perfect.",
        status: "APPROVED",
        createdAt: "2026-03-10T00:00:00.000Z",
        moderatedAt: "2026-03-10T00:00:00.000Z",
        user: null,
      },
    ],
    commentCount: 1,
  });

  const creatorPage = createPublicPageState({
    publishedConfig: createPageConfig({
      blogBackground: {
        type: "image",
        value: "/uploads/blog-list-bg.jpg",
      },
      blogDetailBackground: {
        type: "image",
        value: "/uploads/blog-detail-bg.jpg",
      },
    }),
    blogPosts: [blogPost],
  });

  await setPublicSiteState(context, {
    pages: [creatorPage],
    blogFeed: [blogPost],
    shopCatalog: [],
  });

  await page.goto("/blog");

  await expect(page.getByTestId("public-blog-feed")).toBeVisible();
  await expect(
    page.getByTestId("public-blog-feed-post-post-e2e-1")
  ).toContainText("Spring live behind the scenes");

  await page.goto("/u/creator/blog");

  await expect(page.getByTestId("public-user-blog-list")).toBeVisible();
  await expect(
    page.getByTestId("public-user-blog-post-post-e2e-1")
  ).toContainText("Spring live behind the scenes");
  await expect
    .poll(() => getDirectBackgroundImage(page, "public-user-blog-list"))
    .toContain("/uploads/blog-list-bg.jpg");

  await page
    .getByTestId("public-user-blog-post-post-e2e-1")
    .getByRole("link", { name: "Spring live behind the scenes" })
    .first()
    .click();

  await expect(page).toHaveURL(/\/u\/creator\/blog\/post-e2e-1$/);
  await expect(page.getByTestId("public-user-blog-detail")).toBeVisible();
  await expect(page.getByTestId("public-user-blog-detail-title")).toHaveText(
    "Spring live behind the scenes"
  );
  await expect(page.getByText("The encore section was perfect.")).toBeVisible();
  await expect
    .poll(() => getDirectBackgroundImage(page, "public-user-blog-detail"))
    .toContain("/uploads/blog-detail-bg.jpg");
});

test("renders public news entry and detail pages", async ({ page }) => {
  const publishedConfig = createPageConfig({
    newsBackground: {
      type: "image",
      value: "/uploads/news-list-bg.jpg",
    },
  });
  const newsArticle = createNewsArticle({
    id: "article-e2e-1",
    title: "Tour final guest revealed",
    content: "The final encore guest will join for the Tokyo date.",
    category: "MEDIA",
    tag: "TOUR",
    userSlug: "creator",
    backgroundType: "image",
    backgroundValue: "/uploads/news-detail-bg.jpg",
  });

  await page.route("**/api/news/articles/article-e2e-1", async (route) => {
    await fulfillJson(route, {
      article: newsArticle,
    });
  });

  await page.route("**/api/news/articles*", async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname !== "/api/news/articles") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, {
      articles: [newsArticle],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
  });

  await page.route("**/api/page/creator", async (route) => {
    await fulfillJson(route, {
      slug: "creator",
      displayName: "Creator",
      config: publishedConfig,
    });
  });

  await page.goto("/news?from=%2Fu%2Fcreator");

  await expect(page.getByTestId("public-news-list")).toBeVisible();
  await expect(page.getByTestId("public-news-article-article-e2e-1")).toContainText(
    "Tour final guest revealed"
  );
  await expect
    .poll(() => getDirectBackgroundImage(page, "public-news-list"))
    .toContain("/uploads/news-list-bg.jpg");

  await page.goto("/news/article-e2e-1?from=%2Fu%2Fcreator");

  await expect(page).toHaveURL(/\/news\/article-e2e-1(\?|$)/);
  await expect(page.getByTestId("public-news-detail")).toBeVisible();
  await expect(page.getByTestId("public-news-detail-title")).toHaveText(
    "Tour final guest revealed"
  );
  await expect(page.getByText("The final encore guest will join")).toBeVisible();
  await expect
    .poll(() => getDirectBackgroundImage(page, "public-news-detail"))
    .toContain("/uploads/news-detail-bg.jpg");
});

test("renders public shop entry and creator detail pages", async ({
  context,
  page,
}) => {
  const product = createProduct({
    id: "product-e2e-1",
    name: "Anniversary acrylic stand",
    description: "A two-piece acrylic stand with the spring costume art.",
    images: ["/hero/2.jpeg"],
    price: 3200,
  });

  const creatorPage = createPublicPageState({
    publishedConfig: createPageConfig({
      shopBackground: {
        type: "image",
        value: "/uploads/shop-list-bg.jpg",
      },
      shopDetailBackground: {
        type: "image",
        value: "/uploads/shop-detail-bg.jpg",
      },
    }),
    products: [product],
  });

  await setPublicSiteState(context, {
    pages: [creatorPage],
    blogFeed: [],
    shopCatalog: [product],
  });

  await page.goto("/shop");

  await expect(page.getByTestId("public-shop-catalog")).toBeVisible();
  await expect(
    page.getByTestId("public-shop-catalog-product-product-e2e-1")
  ).toContainText("Anniversary acrylic stand");

  await page.goto("/u/creator/shop");

  await expect(page.getByTestId("public-user-shop-list")).toBeVisible();
  await expect(
    page.getByTestId("public-user-shop-product-product-e2e-1")
  ).toContainText("Anniversary acrylic stand");
  await expect
    .poll(() => getDirectBackgroundImage(page, "public-user-shop-list"))
    .toContain("/uploads/shop-list-bg.jpg");

  await page.getByTestId("public-user-shop-product-product-e2e-1").click();

  await expect(page).toHaveURL(/\/u\/creator\/shop\/product-e2e-1$/);
  await expect(page.getByTestId("public-user-shop-detail")).toBeVisible();
  await expect(page.getByTestId("public-user-shop-detail-title")).toHaveText(
    "Anniversary acrylic stand"
  );
  await expect(
    page.getByText("A two-piece acrylic stand with the spring costume art.")
  ).toBeVisible();
  await expect
    .poll(() => getDirectBackgroundImage(page, "public-user-shop-detail"))
    .toContain("/uploads/shop-detail-bg.jpg");
});

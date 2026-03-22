import { expect, test, type Route } from "@playwright/test";
import type { MediaAssetUsageContext } from "@/domain/media/usage";
import {
  bootstrapAdminE2E,
  createPublicPageStateCookie,
  createMediaAsset,
  createPageConfig,
  fulfillJson,
  mockCurrentUser,
} from "./utils/admin";

type DraftSaveRequest = {
  draftConfig: ReturnType<typeof createPageConfig>;
  themeColor?: string;
  fontFamily?: string;
};

type PublishRequest = {
  publishedConfig: ReturnType<typeof createPageConfig>;
};

type ReplaceRequest = {
  sourceAssetId: string;
  targetAssetId: string;
};

type UsageRequest = {
  ids: string[];
  usageContext?: MediaAssetUsageContext;
  action: "ADD" | "REMOVE" | "CLEAR";
};

function readRequestBody(route: Route): Record<string, unknown> {
  const body = route.request().postDataJSON();
  return body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

function getHeroTitleFromConfig(config: ReturnType<typeof createPageConfig>) {
  const heroSection = config.sections[0];
  return heroSection?.type === "hero" ? heroSection.props.title : undefined;
}

test.beforeEach(async ({ context, page }) => {
  await bootstrapAdminE2E(context, page);
  await mockCurrentUser(page);
});

test("saves a CMS draft and publishes the updated page", async ({ page }) => {
  const saveRequests: DraftSaveRequest[] = [];
  const publishRequests: PublishRequest[] = [];
  let currentDraft = createPageConfig({
    background: {
      type: "image",
      value: "/hero/3.jpeg",
    },
    logo: {
      src: "/hero/2.jpeg",
      alt: "Creator Logo",
      opacity: 0.8,
    },
  });
  let currentThemeColor = "#445566";
  let currentFontFamily = "Noto Sans JP";

  await page.route("**/api/page/me", async (route) => {
    if (route.request().method() === "GET") {
      await fulfillJson(route, {
        draftConfig: currentDraft,
        themeColor: currentThemeColor,
        fontFamily: currentFontFamily,
      });
      return;
    }

    const body = readRequestBody(route) as DraftSaveRequest;
    saveRequests.push(body);
    currentDraft = body.draftConfig;
    currentThemeColor = body.themeColor || currentThemeColor;
    currentFontFamily = body.fontFamily || currentFontFamily;

    await fulfillJson(route, {
      ok: true,
      pageConfig: currentDraft,
      themeColor: currentThemeColor,
      fontFamily: currentFontFamily,
    });
  });

  await page.route("**/api/page/me/publish", async (route) => {
    publishRequests.push({
      publishedConfig: currentDraft,
    });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "set-cookie": createPublicPageStateCookie({
          slug: "creator",
          displayName: "Creator",
          themeColor: currentThemeColor,
          fontFamily: currentFontFamily,
          publishedConfig: currentDraft,
        }),
      },
      body: JSON.stringify({
        ok: true,
        publishedConfig: currentDraft,
      }),
    });
  });

  await page.goto("/admin/cms");
  await page.waitForResponse("**/api/page/me");

  await page.getByTestId("cms-architect-section-hero").click();

  const titleInput = page.getByTestId("cms-hero-title-input");
  await expect(titleInput).toBeVisible();
  await titleInput.fill("直播预告");

  await page.getByTestId("cms-save-draft").click();

  await expect.poll(() => saveRequests.length).toBe(1);
  await expect(page.getByLabel("通知").getByText("草稿已保存")).toBeVisible({ timeout: 10_000 });
  expect(getHeroTitleFromConfig(saveRequests[0].draftConfig)).toBe("直播预告");
  expect(saveRequests[0]?.draftConfig?.hasPublished).toBeUndefined();

  await page.getByTestId("cms-publish").click();
  await expect(page.getByTestId("confirm-dialog")).toBeVisible();
  await page.getByTestId("confirm-dialog-confirm").click();

  await expect.poll(() => saveRequests.length).toBe(2);
  await expect.poll(() => publishRequests.length).toBe(1);
  await expect(page.getByLabel("通知").getByText("已发布！")).toBeVisible({ timeout: 10_000 });

  expect(getHeroTitleFromConfig(saveRequests[1].draftConfig)).toBe("直播预告");
  expect(saveRequests[1]?.draftConfig?.hasPublished).toBe(true);
  expect(getHeroTitleFromConfig(publishRequests[0].publishedConfig)).toBe("直播预告");

  await page.goto("/u/creator");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "直播预告" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByAltText("Creator Logo")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByAltText("Creator Logo")).toHaveAttribute(
    "src",
    /%2Fhero%2F2\.jpeg/,
    { timeout: 10_000 }
  );
  await expect(page.getByTestId("public-page-renderer")).toBeVisible();

  await expect
    .poll(
      () =>
        page
          .getByTestId("public-page-renderer")
          .evaluate((element) => getComputedStyle(element).backgroundImage),
      { timeout: 10_000 }
    )
    .toContain("/hero/3.jpeg");

  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--theme-primary")
          .trim()
      )
    )
    .toBe("#445566");
});

test("replaces a referenced background asset from the media library flow", async ({
  page,
}) => {
  const saveRequests: DraftSaveRequest[] = [];
  let currentDraft = createPageConfig({
    background: {
      type: "image",
      value: "/uploads/old-background.jpg",
    },
  });

  const currentAssets = [
    createMediaAsset({
      id: "asset-old",
      src: "/uploads/old-background.jpg",
      originalName: "old-background.jpg",
      usageContexts: ["PAGE_BACKGROUND"],
      isInUse: true,
      referenceCount: 1,
      references: [
        {
          kind: "PAGE_DRAFT_CONFIG",
          entityId: "page-1",
          entityLabel: "Creator Page",
          field: "background.value",
        },
      ],
    }),
    createMediaAsset({
      id: "asset-new",
      src: "/uploads/new-background.jpg",
      originalName: "new-background.jpg",
      usageContexts: ["PAGE_BACKGROUND"],
    }),
  ];

  await page.route("**/api/media-assets*", async (route) => {
    await fulfillJson(route, {
      assets: currentAssets,
      pagination: {
        page: 1,
        limit: 24,
        total: currentAssets.length,
        totalPages: 1,
      },
    });
  });

  await page.route("**/api/page/me", async (route) => {
    if (route.request().method() === "GET") {
      await fulfillJson(route, {
        draftConfig: currentDraft,
        themeColor: "#445566",
        fontFamily: "Noto Sans JP",
      });
      return;
    }

    const body = readRequestBody(route) as DraftSaveRequest;
    saveRequests.push(body);
    currentDraft = body.draftConfig;

    await fulfillJson(route, {
      ok: true,
      pageConfig: currentDraft,
      themeColor: body.themeColor,
      fontFamily: body.fontFamily,
    });
  });

  await page.goto("/admin/media");
  await expect(page.getByTestId("media-library-browser")).toBeVisible();

  await page.getByTestId("media-asset-go-to-replace-asset-old-0").click();

  await expect(page).toHaveURL(
    /\/admin\/cms\?panel=background/,
    { timeout: 10_000 }
  );
  await expect(page.getByTestId("cms-architect-background")).toHaveAttribute(
    "data-state",
    "open"
  );

  await page.getByTestId("background-open-media-picker").click();
  await expect(page.getByTestId("media-picker-dialog")).toBeVisible();
  await page.getByTestId("media-asset-select-asset-new").click();

  await expect(page.getByTestId("background-image-url-input")).toHaveValue(
    "/uploads/new-background.jpg"
  );

  await page.getByTestId("cms-save-draft").click();

  await expect.poll(() => saveRequests.length).toBe(1);
  expect(saveRequests[0]?.draftConfig?.background).toEqual({
    type: "image",
    value: "/uploads/new-background.jpg",
  });
});

test("replaces references directly inside the media library", async ({
  page,
}) => {
  let currentAssets = [
    createMediaAsset({
      id: "asset-old",
      src: "/uploads/old-background.jpg",
      originalName: "old-background.jpg",
      usageContexts: ["PAGE_BACKGROUND"],
      isInUse: true,
      referenceCount: 1,
      references: [
        {
          kind: "PAGE_DRAFT_CONFIG",
          entityId: "page-1",
          entityLabel: "Creator Page",
          field: "background.value",
        },
      ],
    }),
    createMediaAsset({
      id: "asset-new",
      src: "/uploads/new-background.jpg",
      originalName: "new-background.jpg",
      usageContexts: ["PAGE_BACKGROUND"],
      isInUse: false,
      referenceCount: 0,
      references: [],
    }),
  ];
  const replaceRequests: ReplaceRequest[] = [];

  await page.route("**/api/media-assets/replace", async (route) => {
    const body = readRequestBody(route) as ReplaceRequest;
    replaceRequests.push(body);
    currentAssets = [
      {
        ...currentAssets[0],
        isInUse: false,
        referenceCount: 0,
        references: [],
      },
      {
        ...currentAssets[1],
        isInUse: true,
        referenceCount: 1,
        references: [
          {
            kind: "PAGE_DRAFT_CONFIG",
            entityId: "page-1",
            entityLabel: "Creator Page",
            field: "background.value",
          },
        ],
      },
    ];

    await fulfillJson(route, {
      ok: true,
      replacedReferenceCount: 1,
      updatedEntityCount: 1,
    });
  });

  await page.route("**/api/media-assets*", async (route) => {
    await fulfillJson(route, {
      assets: currentAssets,
      pagination: {
        page: 1,
        limit: 24,
        total: currentAssets.length,
        totalPages: 1,
      },
    });
  });

  await page.goto("/admin/media");
  await expect(page.getByTestId("media-library-browser")).toBeVisible();

  await page.getByTestId("media-asset-open-replace-asset-old").click();
  await expect(page.getByTestId("media-picker-dialog")).toBeVisible();
  await expect(page.getByTestId("media-asset-select-asset-old")).toBeDisabled();

  await page.getByTestId("media-asset-select-asset-new").click();

  await expect.poll(() => replaceRequests.length).toBe(1);
  expect(replaceRequests[0]).toEqual({
    sourceAssetId: "asset-old",
    targetAssetId: "asset-new",
  });

  await expect(
    page.getByTestId("media-asset-card-asset-old").getByText("可安全删除")
  ).toBeVisible();
  await expect(
    page.getByTestId("media-asset-card-asset-new").getByText("已被引用 1 处")
  ).toBeVisible();
  await expect(page.getByLabel("通知").getByText("已替换 1 处引用")).toBeVisible({ timeout: 10_000 });
});

test("updates media usage tags in bulk from the media library", async ({
  page,
}) => {
  let currentAssets = [
    createMediaAsset({
      id: "asset-1",
      src: "/uploads/asset-1.jpg",
      originalName: "asset-1.jpg",
      usageContexts: [],
    }),
    createMediaAsset({
      id: "asset-2",
      src: "/uploads/asset-2.jpg",
      originalName: "asset-2.jpg",
      usageContexts: ["PAGE_BACKGROUND"],
    }),
  ];
  const usageRequests: UsageRequest[] = [];

  await page.route("**/api/media-assets*", async (route) => {
    if (route.request().method() === "PATCH") {
      const body = readRequestBody(route) as UsageRequest;
      usageRequests.push(body);

      currentAssets = currentAssets.map((asset) => {
        if (!body.ids.includes(asset.id)) {
          return asset;
        }

        if (body.action === "CLEAR") {
          return {
            ...asset,
            usageContexts: [],
          };
        }

        if (body.action === "REMOVE" && body.usageContext) {
          return {
            ...asset,
            usageContexts: asset.usageContexts.filter(
              (value) => value !== body.usageContext
            ),
          };
        }

        if (!body.usageContext) {
          return asset;
        }

        return {
          ...asset,
          usageContexts: Array.from(
            new Set([...asset.usageContexts, body.usageContext])
          ),
        };
      });

      await fulfillJson(route, {
        ok: true,
        assets: currentAssets.filter((asset) => body.ids.includes(asset.id)),
      });
      return;
    }

    await fulfillJson(route, {
      assets: currentAssets,
      pagination: {
        page: 1,
        limit: 24,
        total: currentAssets.length,
        totalPages: 1,
      },
    });
  });

  await page.goto("/admin/media");
  await expect(page.getByTestId("media-library-browser")).toBeVisible();

  await page
    .getByTestId("media-asset-card-asset-1")
    .locator('input[type="checkbox"]')
    .check();
  await page
    .getByTestId("media-asset-card-asset-2")
    .locator('input[type="checkbox"]')
    .check();

  await page.getByTestId("media-library-bulk-tag-action").selectOption("ADD");
  await page
    .getByTestId("media-library-bulk-tag-context")
    .selectOption("BLOG_COVER");
  await page.getByTestId("media-library-bulk-tag-apply").click();

  await expect.poll(() => usageRequests.length).toBe(1);
  expect(usageRequests[0]).toEqual({
    ids: ["asset-1", "asset-2"],
    usageContext: "BLOG_COVER",
    action: "ADD",
  });
  await expect(
    page.getByTestId("media-asset-card-asset-1").getByText("博客封面")
  ).toBeVisible();
  await expect(
    page.getByLabel("通知").getByText("已批量添加标签")
  ).toBeVisible({ timeout: 10_000 });

  await page.getByTestId("media-library-bulk-tag-action").selectOption("CLEAR");
  await page.getByTestId("media-library-bulk-tag-apply").click();

  await expect.poll(() => usageRequests.length).toBe(2);
  expect(usageRequests[1]).toEqual({
    ids: ["asset-1", "asset-2"],
    action: "CLEAR",
  });
  await expect(
    page.getByTestId("media-asset-card-asset-1").getByText("未标记场景")
  ).toBeVisible();
  await expect(
    page.getByLabel("通知").getByText("已清空已选素材标签")
  ).toBeVisible({ timeout: 10_000 });
});

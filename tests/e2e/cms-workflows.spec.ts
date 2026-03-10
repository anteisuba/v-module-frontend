import { expect, test } from "@playwright/test";
import {
  bootstrapAdminE2E,
  createPublicPageStateCookie,
  createMediaAsset,
  createPageConfig,
  fulfillJson,
  mockCurrentUser,
} from "./utils/admin";

test.beforeEach(async ({ context, page }) => {
  await bootstrapAdminE2E(context, page);
  await mockCurrentUser(page);
});

test("saves a CMS draft and publishes the updated page", async ({ page }) => {
  const saveRequests: Array<Record<string, any>> = [];
  const publishRequests: Array<Record<string, any>> = [];
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

    const body = route.request().postDataJSON() as Record<string, any>;
    saveRequests.push(body);
    currentDraft = body.draftConfig;
    currentThemeColor = body.themeColor;
    currentFontFamily = body.fontFamily;

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

  const titleInput = page.getByLabel(/标题（Title）/);
  await expect(titleInput).toBeVisible();
  await titleInput.fill("直播预告");

  await page.getByTestId("cms-save-draft").click();

  await expect.poll(() => saveRequests.length).toBe(1);
  await expect(page.getByLabel("通知").getByText("草稿已保存")).toBeVisible();
  expect(saveRequests[0]?.draftConfig?.sections?.[0]?.props?.title).toBe(
    "直播预告"
  );
  expect(saveRequests[0]?.draftConfig?.hasPublished).toBeUndefined();

  await page.getByTestId("cms-publish").click();
  await expect(page.getByTestId("confirm-dialog")).toBeVisible();
  await page.getByTestId("confirm-dialog-confirm").click();

  await expect.poll(() => saveRequests.length).toBe(2);
  await expect.poll(() => publishRequests.length).toBe(1);
  await expect(page.getByLabel("通知").getByText("已发布！")).toBeVisible();

  expect(saveRequests[1]?.draftConfig?.sections?.[0]?.props?.title).toBe(
    "直播预告"
  );
  expect(saveRequests[1]?.draftConfig?.hasPublished).toBe(true);
  expect(
    publishRequests[0]?.publishedConfig?.sections?.[0]?.props?.title
  ).toBe("直播预告");

  await page.goto("/u/creator");

  await expect(page.getByRole("heading", { name: "直播预告" })).toBeVisible();
  await expect(page.getByAltText("Creator Logo")).toBeVisible();
  await expect(page.getByAltText("Creator Logo")).toHaveAttribute(
    "src",
    /%2Fhero%2F2\.jpeg/
  );
  await expect(page.getByTestId("public-page-renderer")).toBeVisible();

  const backgroundImage = await page
    .getByTestId("public-page-renderer")
    .evaluate((element) => getComputedStyle(element).backgroundImage);

  expect(backgroundImage).toContain("/hero/3.jpeg");

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
  const saveRequests: Array<Record<string, any>> = [];
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

    const body = route.request().postDataJSON() as Record<string, any>;
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
    /\/admin\/cms\?tab=page&panel=background&focus=page-background/
  );
  await expect(page.getByTestId("admin-panel-toggle-background")).toHaveAttribute(
    "data-state",
    "open"
  );
  await expect(page.locator("#page-background-editor")).toBeVisible();

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

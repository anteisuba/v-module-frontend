// components/ui/MenuSectionEditor.tsx
"use client";

import { useI18n } from "@/lib/i18n/context";
import type {
  PageConfig,
  NavLinkItem,
  MenuSectionProps,
} from "@/domain/page-config/types";

// ────────────────────────────────────────────────────────────────────
// 内置导航项目定义（可开/关）
// ────────────────────────────────────────────────────────────────────
const DEFAULT_NAV_ITEMS: Omit<NavLinkItem, "enabled">[] = [
  { id: "nav-news", key: "news", label: "News", href: "/news" },
  { id: "nav-blog", key: "blog", label: "Blog", href: "/blog" },
  { id: "nav-shop", key: "shop", label: "Shop", href: "/shop" },
  { id: "nav-media", key: "media", label: "Media", href: "/media" },
  { id: "nav-profile", key: "profile", label: "Profile", href: "/profile" },
  { id: "nav-contact", key: "contact", label: "Contact", href: "/contact" },
];

// ────────────────────────────────────────────────────────────────────
// 小工具
// ────────────────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-black/10" />
      <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">{label}</span>
      <div className="h-px flex-1 bg-black/10" />
    </div>
  );
}

function MiniToggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={[
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-1",
        enabled ? "bg-black" : "bg-black/25",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ].join(" ")}
      aria-label="Toggle"
    >
      <span
        className={[
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
          enabled ? "translate-x-4.5" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────
interface MenuSectionEditorProps {
  config: PageConfig;
  onConfigChange: (config: PageConfig) => void;
  disabled?: boolean;
}

// ────────────────────────────────────────────────────────────────────
// 主组件
// ────────────────────────────────────────────────────────────────────
export default function MenuSectionEditor({
  config,
  onConfigChange,
  disabled = false,
}: MenuSectionEditorProps) {
  const { t } = useI18n();

  // ── menu section 辅助 ──────────────────────────────────────────
  function getMenuSection() {
    return config.sections.find((s) => s.type === "menu");
  }

  function getMenuProps(): MenuSectionProps {
    const sec = getMenuSection();
    return sec?.type === "menu" ? sec.props : {};
  }

  function updateMenuProps(updates: Partial<MenuSectionProps>) {
    const sec = getMenuSection();
    if (!sec || sec.type !== "menu") return;
    onConfigChange({
      ...config,
      sections: config.sections.map((s) =>
        s.id === sec.id && s.type === "menu"
          ? { ...s, props: { ...s.props, ...updates } }
          : s
      ),
    });
  }

  // ── 导航项 ────────────────────────────────────────────────────────
  function getNavItems(): NavLinkItem[] {
    const props = getMenuProps();
    if (props.items && props.items.length > 0) return props.items;
    // 初始化默认列表
    return DEFAULT_NAV_ITEMS.map((item) => ({ ...item, enabled: true }));
  }

  function updateNavItems(items: NavLinkItem[]) {
    updateMenuProps({ items });
  }

  function toggleNavItem(id: string) {
    const items = getNavItems().map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    updateNavItems(items);
  }

  function updateNavItemLabel(id: string, label: string) {
    const items = getNavItems().map((item) =>
      item.id === id ? { ...item, label } : item
    );
    updateNavItems(items);
  }

  function updateNavItemHref(id: string, href: string) {
    const items = getNavItems().map((item) =>
      item.id === id ? { ...item, href } : item
    );
    updateNavItems(items);
  }

  function moveNavItem(id: string, dir: "up" | "down") {
    const items = [...getNavItems()];
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= items.length) return;
    [items[idx], items[target]] = [items[target], items[idx]];
    updateNavItems(items);
  }

  function addCustomNavItem() {
    const items = getNavItems();
    const newItem: NavLinkItem = {
      id: `nav-custom-${Date.now()}`,
      key: "custom",
      label: "Custom",
      href: "/",
      enabled: true,
    };
    updateNavItems([...items, newItem]);
  }

  // ── 样式 ──────────────────────────────────────────────────────────
  const menuProps = getMenuProps();
  const navItems = getNavItems();

  return (
    <div className="space-y-6">

      {/* ─── 1. 导航项目 ─── */}
      <section>
        <SectionDivider label={t("menuEditor.navItems.title")} />
        <div className="mt-3 space-y-2">
          {navItems.map((item, idx) => (
            <div
              key={item.id}
              className={[
                "rounded-xl border border-black/8 bg-white/60 p-3 transition-opacity",
                !item.enabled && "opacity-50",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                {/* 上下移动 */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveNavItem(item.id, "up")}
                    disabled={disabled || idx === 0}
                    className="flex h-4 w-4 items-center justify-center rounded text-black/30 transition hover:bg-black/5 hover:text-black/60 disabled:opacity-20"
                  >
                    <span className="text-[10px] leading-none">↑</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveNavItem(item.id, "down")}
                    disabled={disabled || idx === navItems.length - 1}
                    className="flex h-4 w-4 items-center justify-center rounded text-black/30 transition hover:bg-black/5 hover:text-black/60 disabled:opacity-20"
                  >
                    <span className="text-[10px] leading-none">↓</span>
                  </button>
                </div>

                {/* 标签 + 链接 */}
                <div className="flex min-w-0 flex-1 gap-2">
                  <input
                    type="text"
                    value={item.label ?? item.key}
                    onChange={(e) => updateNavItemLabel(item.id, e.target.value)}
                    disabled={disabled}
                    placeholder={t("menuEditor.navItems.labelPlaceholder")}
                    className="w-24 shrink-0 rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-xs text-black placeholder-black/30 focus:outline-none focus:ring-1 focus:ring-black/20"
                  />
                  <input
                    type="text"
                    value={item.href ?? ""}
                    onChange={(e) => updateNavItemHref(item.id, e.target.value)}
                    disabled={disabled}
                    placeholder={t("menuEditor.navItems.hrefPlaceholder")}
                    className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-xs text-black placeholder-black/30 focus:outline-none focus:ring-1 focus:ring-black/20"
                  />
                </div>

                {/* 开关 */}
                <MiniToggle
                  enabled={item.enabled}
                  onChange={() => toggleNavItem(item.id)}
                  disabled={disabled}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addCustomNavItem}
            disabled={disabled}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/15 py-2 text-xs text-black/40 transition hover:border-black/30 hover:text-black/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-base leading-none">+</span>
            {t("menuEditor.navItems.addCustom")}
          </button>
        </div>
      </section>

      {/* ─── 2. 菜单样式 ─── */}
      <section>
        <SectionDivider label={t("menuEditor.style.title")} />
        <div className="mt-3 rounded-xl border border-black/8 bg-white/60 p-4 space-y-3">
          {/* 背景模糊 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-black/70">{t("menuEditor.style.backdropBlur")}</span>
            <MiniToggle
              enabled={menuProps.style?.backdropBlur !== false}
              onChange={() =>
                updateMenuProps({
                  style: {
                    ...menuProps.style,
                    backdropBlur: menuProps.style?.backdropBlur === false ? true : false,
                  },
                })
              }
              disabled={disabled}
            />
          </div>

          {/* 按钮样式 */}
          <div className="space-y-1.5">
            <label className="block text-xs text-black/60">{t("menuEditor.style.buttonVariant")}</label>
            <div className="flex gap-2">
              {(["default", "outline", "ghost"] as const).map((variant) => {
                const labelKey = `menuEditor.style.variant${variant.charAt(0).toUpperCase() + variant.slice(1)}` as const;
                return (
                  <button
                    key={variant}
                    type="button"
                    onClick={() =>
                      updateMenuProps({
                        style: { ...menuProps.style, buttonVariant: variant },
                      })
                    }
                    disabled={disabled}
                    className={[
                      "flex-1 rounded-lg border py-1.5 text-xs transition",
                      (menuProps.style?.buttonVariant ?? "default") === variant
                        ? "border-black bg-black text-white"
                        : "border-black/15 bg-white/60 text-black/50 hover:border-black/30 hover:text-black",
                    ].join(" ")}
                  >
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

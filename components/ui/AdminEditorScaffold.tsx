"use client";

import type { ReactNode } from "react";

export type AdminEditorTabOption = {
  id: string;
  title: string;
  description: string;
};

export type AdminEditorPanelItem = {
  id: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  content: ReactNode;
  bodyClassName?: string;
};

interface AdminEditorTabsProps {
  tabs: AdminEditorTabOption[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

interface AdminEditorAccordionProps {
  panels: AdminEditorPanelItem[];
  openPanelId: string | null;
  onToggle: (panelId: string) => void;
  className?: string;
}

interface AdminEditorCardProps {
  children: ReactNode;
  className?: string;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AdminEditorCard({
  children,
  className,
}: AdminEditorCardProps) {
  return (
    <div
      className={joinClasses(
        "editorial-panel border-[color:var(--editorial-border)] bg-[color:var(--editorial-surface-strong)] shadow-[0_24px_72px_rgba(17,12,6,0.12)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AdminEditorTabs({
  tabs,
  activeTab,
  onChange,
  className,
}: AdminEditorTabsProps) {
  return (
    <AdminEditorCard className={joinClasses("mb-6 p-3", className)}>
      <div className="grid gap-3 md:grid-cols-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              data-testid={`admin-tab-${tab.id}`}
              data-state={isActive ? "active" : "inactive"}
              className={joinClasses(
                "rounded-[22px] border px-4 py-4 text-left transition-colors duration-300",
                isActive
                  ? "border-[color:var(--editorial-accent)] bg-[color:var(--editorial-accent)] text-[color:var(--editorial-accent-foreground)] shadow-sm"
                  : "border-[color:var(--editorial-border)] bg-[color:color-mix(in_srgb,var(--editorial-surface)_82%,transparent)] text-[color:var(--editorial-text)] hover:bg-[color:color-mix(in_srgb,var(--editorial-text)_5%,transparent)]"
              )}
            >
              <div className="font-serif text-lg leading-none">{tab.title}</div>
              <div
                className={joinClasses(
                  "mt-2 text-[11px] uppercase tracking-[0.18em]",
                  isActive
                    ? "text-[color:color-mix(in_srgb,var(--editorial-accent-foreground)_72%,transparent)]"
                    : "text-[color:var(--editorial-muted)]"
                )}
              >
                {tab.description}
              </div>
            </button>
          );
        })}
      </div>
    </AdminEditorCard>
  );
}

export function AdminEditorAccordion({
  panels,
  openPanelId,
  onToggle,
  className,
}: AdminEditorAccordionProps) {
  return (
    <div className={joinClasses("space-y-4", className)}>
      {panels.map((panel, index) => {
        const isOpen = openPanelId === panel.id;

        return (
          <AdminEditorCard key={panel.id} className="overflow-hidden">
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <button
                type="button"
                onClick={() => onToggle(panel.id)}
                data-testid={`admin-panel-toggle-${panel.id}`}
                data-state={isOpen ? "open" : "closed"}
                className="flex min-w-0 flex-1 items-start gap-4 text-left"
                aria-expanded={isOpen}
                aria-controls={`editor-panel-${panel.id}`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--editorial-border)] bg-[color:color-mix(in_srgb,var(--editorial-surface)_92%,transparent)] text-[11px] uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-xl leading-none text-[color:var(--editorial-text)]">
                    {panel.title}
                  </h2>
                  {panel.description ? (
                    <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
                      {panel.description}
                    </p>
                  ) : null}
                </div>
                <span className="pt-1 text-lg leading-none text-[color:var(--editorial-muted)]">
                  {isOpen ? "-" : "+"}
                </span>
              </button>

              {panel.actions ? (
                <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                  {panel.actions}
                </div>
              ) : null}
            </div>

            {isOpen ? (
              <div
                id={`editor-panel-${panel.id}`}
                data-testid={`admin-panel-body-${panel.id}`}
                className={joinClasses(
                  "border-t border-[color:var(--editorial-border)] px-3 pb-3 pt-3 sm:px-4 sm:pb-4",
                  panel.bodyClassName
                )}
              >
                {panel.content}
              </div>
            ) : null}
          </AdminEditorCard>
        );
      })}
    </div>
  );
}

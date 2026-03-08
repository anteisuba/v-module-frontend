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
        "rounded-[28px] border border-black/10 bg-white/45 shadow-sm backdrop-blur-xl",
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
              className={joinClasses(
                "rounded-[22px] border px-4 py-4 text-left transition-colors",
                isActive
                  ? "border-black bg-black text-white shadow-sm"
                  : "border-black/10 bg-white/70 text-black hover:bg-white"
              )}
            >
              <div className="text-sm font-semibold">{tab.title}</div>
              <div
                className={joinClasses(
                  "mt-1 text-xs",
                  isActive ? "text-white/75" : "text-black/55"
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
                className="flex min-w-0 flex-1 items-start gap-4 text-left"
                aria-expanded={isOpen}
                aria-controls={`editor-panel-${panel.id}`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/75 text-[11px] font-semibold text-black/60">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-black">
                    {panel.title}
                  </h2>
                  {panel.description ? (
                    <p className="mt-1 text-xs text-black/55">
                      {panel.description}
                    </p>
                  ) : null}
                </div>
                <span className="pt-1 text-lg leading-none text-black/55">
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
                className={joinClasses(
                  "border-t border-black/10 px-3 pb-3 pt-3 sm:px-4 sm:pb-4",
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

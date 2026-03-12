"use client";

import type { ReactNode } from "react";
import BackButton from "./BackButton";
import LanguageSelector from "./LanguageSelector";

interface AdminEditorPageProps {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  maxWidthClassName?: string;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminEditorPage({
  backHref,
  backLabel,
  title,
  description,
  action,
  children,
  maxWidthClassName = "max-w-6xl",
}: AdminEditorPageProps) {
  return (
    <main className="editorial-shell editorial-shell--light relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-c.jpeg)" }}
        />
      </div>

      <div
        className={joinClasses(
          "editorial-container relative z-10 px-6 py-10",
          maxWidthClassName
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <BackButton
            href={backHref}
            label={backLabel}
            fixed={false}
            className="!m-0 !left-0 !top-0"
          />
          <LanguageSelector position="inline" menuPosition="bottom" />
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="editorial-kicker">Editorial Console</div>
            <h1 className="editorial-title mt-3 text-[color:var(--editorial-text)]">
              {title}
            </h1>
            {description ? (
              <p className="editorial-copy mt-3 text-sm text-[color:var(--editorial-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {children}
      </div>
    </main>
  );
}

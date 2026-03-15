import type { ReactNode } from "react";

interface EditorialAuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  panel: ReactNode;
  topRight?: ReactNode;
  footer?: ReactNode;
  stats?: Array<{
    label: string;
    value: string;
  }>;
}

export default function EditorialAuthLayout({
  eyebrow,
  title,
  description,
  panel,
  topRight,
  footer,
  stats = [],
}: EditorialAuthLayoutProps) {
  return (
    <main className="editorial-shell editorial-shell--light">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-18"
          style={{ backgroundImage: "url(/login/login-b.jpeg)" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(155,122,61,0.18),transparent_28%),linear-gradient(180deg,rgba(251,247,240,0.76),rgba(245,242,236,0.94)_42%,rgba(236,231,221,0.98))]" />
      </div>

      <div className="editorial-container flex min-h-screen flex-col">
        <div className="flex justify-end">{topRight}</div>

        <div className="grid flex-1 items-start gap-6 pb-8 pt-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.82fr)] lg:gap-16 lg:py-12">
          {/* Login panel first on mobile (order-1 → visually first), intro second */}
          <section className="reveal order-2 max-w-2xl pt-0 lg:order-1 lg:pt-20">
            <div className="editorial-kicker">{eyebrow}</div>
            <div className="line-wipe mt-6 max-w-sm" />
            <h1 className="editorial-hero-title mt-8 text-[color:var(--editorial-text)]">
              {title}
            </h1>
            <p className="editorial-subtitle mt-6">{description}</p>

            {stats.length > 0 ? (
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {stats.map((stat) => (
                  <div key={stat.label} className="editorial-stat reveal">
                    <div className="editorial-stat__label">{stat.label}</div>
                    <div className="editorial-stat__value">{stat.value}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="reveal order-1 lg:order-2 lg:pt-10">
            <div className="editorial-panel p-6 sm:p-8 lg:p-10">{panel}</div>
          </section>
        </div>

        {footer ? (
          <footer className="reveal border-t border-[color:color-mix(in_srgb,var(--editorial-border)_82%,transparent)] pb-2 pt-6 text-[11px] uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
            {footer}
          </footer>
        ) : null}
      </div>
    </main>
  );
}

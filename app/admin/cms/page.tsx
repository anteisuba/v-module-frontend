"use client";

import { useEffect, useMemo, useState } from "react";

type HeroSlide = {
  slot: 1 | 2 | 3;
  src: string;
  alt?: string | null;
};

export default function CMSPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<"upload" | "delete" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const bySlot = useMemo(() => {
    const map = new Map<number, HeroSlide>();
    for (const s of slides) map.set(s.slot, s);
    return map;
  }, [slides]);

  function toastOk(msg: string) {
    setOk(msg);
    setTimeout(() => setOk(null), 1800);
  }

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hero/slides", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "读取失败");
      setSlides((data.slides ?? []) as HeroSlide[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "读取失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function upload(slot: 1 | 2 | 3, file: File) {
    setBusySlot(slot);
    setBusyAction("upload");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("slot", String(slot));
      fd.append("file", file);

      const res = await fetch("/api/admin/hero/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "上传失败");

      await refresh();
      toastOk(`Slot ${slot} 已更新`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setBusySlot(null);
      setBusyAction(null);
    }
  }

  async function remove(slot: 1 | 2 | 3) {
    setBusySlot(slot);
    setBusyAction("delete");
    setError(null);
    try {
      const res = await fetch(`/api/admin/hero/slide?slot=${slot}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "删除失败");

      await refresh();
      toastOk(`Slot ${slot} 已删除`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setBusySlot(null);
      setBusyAction(null);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* ✅ 背景图：public/login 下的图片 */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-b.jpeg)" }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/80" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">CMS</h1>
            <p className="mt-2 text-sm text-white/60">
              这里编辑 Hero / 上传图片（slot 1~3）。
            </p>
          </div>

          <button
            onClick={refresh}
            disabled={loading || busySlot !== null}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-50"
          >
            {loading ? "刷新中…" : "刷新"}
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {ok && (
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {ok}
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((slot) => {
            const s = bySlot.get(slot);
            const busy = busySlot === slot;
            const busyText =
              busyAction === "upload"
                ? "上传中…"
                : busyAction === "delete"
                ? "删除中…"
                : "处理中…";

            return (
              <div
                key={slot}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Hero Slot {slot}</div>
                  {busy && (
                    <div className="text-xs text-white/60">{busyText}</div>
                  )}
                </div>

                <div className="mt-4 aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                  {loading ? (
                    <div className="flex h-full items-center justify-center text-xs text-white/50">
                      加载中…
                    </div>
                  ) : s?.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.src}
                      alt={s.alt ?? `hero-${slot}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-white/50">
                      未设置
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block">
                    <div className="text-xs text-white/70">
                      {s?.src ? "替换图片" : "上传图片"}
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="mt-2 block w-full text-xs text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:text-white hover:file:bg-white/15"
                      disabled={busy || busySlot !== null}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        upload(slot as 1 | 2 | 3, f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <button
                    className="w-full rounded-xl bg-white/10 py-2 text-sm hover:bg-white/15 disabled:opacity-50"
                    disabled={busy || busySlot !== null || !s?.src}
                    onClick={() => remove(slot as 1 | 2 | 3)}
                  >
                    删除该 Slot
                  </button>

                  <div className="text-[11px] text-white/55 break-all">
                    {s?.src ? (
                      <>
                        当前：{s.src}{" "}
                        <a
                          className="ml-2 underline text-white/70 hover:text-white"
                          href={s.src}
                          target="_blank"
                          rel="noreferrer"
                        >
                          打开
                        </a>
                      </>
                    ) : (
                      "当前：无"
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-xs text-white/50">
          说明：上传文件会保存到 <code>public/upload-img1</code>，并把路径写进
          <code> SiteConfig.heroSlides</code>（按 slot 存 1/2/3）。
        </div>
      </div>
    </main>
  );
}

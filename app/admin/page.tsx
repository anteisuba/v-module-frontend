import AdminAuthPanel from "@/components/login/AdminAuthPanel";

export default function AdminPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* 背景图：铺满 */}
      <div className="absolute inset-0">
        {/* 你也可以换成 next/image，这里先用 div 更省事 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-b.jpeg)" }}
        />
        {/* 雾面淡化层：参考图那种纸面灰 */}
        <div className="absolute inset-0 bg-white/70" />
        {/* 轻微暗角（更“官网”） */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      </div>

      {/* 前景内容 */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6">
        {/* 顶部大标题区（像参考图那样） */}
        <header className="pt-10 text-center">
          <div className="mx-auto inline-flex items-center gap-3">
            <div className="text-5xl font-black tracking-tight">ZUTOMAYO</div>
            <span className="inline-flex items-center bg-black px-3 py-1 text-sm font-bold tracking-[0.2em] text-white">
              LOGIN
            </span>
          </div>
          <div className="mt-3 text-xs tracking-[0.25em] text-black/70">
            PREMIUM 管理入口
          </div>
        </header>

        {/* 表单卡片 */}
        <div className="flex flex-1 items-center justify-center py-10">
          <AdminAuthPanel />
        </div>

        {/* 底部链接栏（先占位） */}
        <footer className="pb-6 text-center text-xs text-black/60">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a className="hover:text-black" href="#">
              关于
            </a>
            <a className="hover:text-black" href="#">
              使用条款
            </a>
            <a className="hover:text-black" href="#">
              隐私政策
            </a>
            <a className="hover:text-black" href="#">
              联系
            </a>
          </div>
          <div className="mt-3 text-black/40">© vtuber-site</div>
        </footer>
      </div>
    </main>
  );
}

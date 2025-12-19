export default function HeroSection() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {/* 右上角浮层：SNS + Menu */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        <a className="text-sm opacity-80 hover:opacity-100 transition" href="#">
          IG
        </a>
        <a className="text-sm opacity-80 hover:opacity-100 transition" href="#">
          X
        </a>
        <a className="text-sm opacity-80 hover:opacity-100 transition" href="#">
          YT
        </a>

        <button className="btn btn-ghost btn-sm" type="button">
          ☰
        </button>
      </div>

      {/* Hero 占位 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl tracking-[0.4em] opacity-80">HERO</span>
      </div>
    </section>
  );
}

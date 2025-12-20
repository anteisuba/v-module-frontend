"use client";

type Props = {
  onMenuClick?: () => void;
};

export default function HeroHeader({ onMenuClick }: Props) {
  return (
    <>
      {/* 左上角 Logo / Tag */}
      <div className="absolute top-6 left-6 z-50">
        <a
          href="#top"
          aria-label="Home"
          className="flex items-center gap-3 select-none"
        >
          {/* 你后面可以换成 /public/logo.svg */}
          <div className="h-14 w-14 rounded-sm bg-white/10 backdrop-blur flex items-center justify-center border border-white/15 overflow-hidden">
            {/* 示例：如果你有 logo 文件就用这个 */}
            {/* <Image src="/logo.svg" alt="logo" width={36} height={36} /> */}
            <span className="text-white text-xs tracking-[0.25em]">ano</span>
          </div>
        </a>
      </div>

      {/* 右上角 SNS + Menu */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4 text-white">
        <a
          className="text-sm opacity-80 hover:opacity-100 transition"
          href="#"
          aria-label="Instagram"
        >
          IG
        </a>
        <a
          className="text-sm opacity-80 hover:opacity-100 transition"
          href="#"
          aria-label="Twitter/X"
        >
          X
        </a>
        <a
          className="text-sm opacity-80 hover:opacity-100 transition"
          href="#"
          aria-label="YouTube"
        >
          YT
        </a>

        <button
          className="btn btn-ghost btn-sm"
          type="button"
          aria-label="menu"
          onClick={onMenuClick}
        >
          ☰
        </button>
      </div>
    </>
  );
}

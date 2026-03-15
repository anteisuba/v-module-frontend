// app/news/[id]/loading.tsx

export default function NewsDetailLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <p style={{ color: "var(--editorial-muted)" }}>Loading...</p>
    </div>
  );
}

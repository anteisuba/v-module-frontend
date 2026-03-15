// app/news/loading.tsx

export default function NewsLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        </div>
        <p className="text-white/80">Loading...</p>
      </div>
    </div>
  );
}

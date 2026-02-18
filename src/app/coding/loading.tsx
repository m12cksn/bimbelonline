export default function CodingLoading() {
  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-6 md:px-6 lg:px-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-10 w-40 rounded-2xl bg-slate-200/70 animate-pulse shimmer" />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-1/2 rounded-xl bg-slate-200/70 animate-pulse shimmer" />
          <div className="mt-4 h-36 rounded-2xl bg-slate-100 animate-pulse shimmer" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-32 rounded-2xl bg-slate-100 animate-pulse shimmer" />
          <div className="h-32 rounded-2xl bg-slate-100 animate-pulse shimmer" />
        </div>
      </div>
    </div>
  );
}

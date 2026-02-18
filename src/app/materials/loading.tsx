export default function MaterialsLoading() {
  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-6 md:px-6 lg:px-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-10 w-44 rounded-2xl bg-slate-200/70 animate-pulse shimmer" />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-1/3 rounded-xl bg-slate-200/70 animate-pulse shimmer" />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="h-40 rounded-2xl bg-slate-100 animate-pulse shimmer" />
            <div className="h-40 rounded-2xl bg-slate-100 animate-pulse shimmer" />
            <div className="h-40 rounded-2xl bg-slate-100 animate-pulse shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

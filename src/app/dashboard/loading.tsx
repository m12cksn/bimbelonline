export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-32 rounded-xl bg-slate-200/70 animate-pulse shimmer" />
          <div className="mt-3 h-8 w-2/3 rounded-2xl bg-slate-200/70 animate-pulse shimmer" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="h-28 rounded-2xl bg-slate-100 animate-pulse shimmer" />
            <div className="h-28 rounded-2xl bg-slate-100 animate-pulse shimmer" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-32 rounded-3xl bg-white border border-slate-200 animate-pulse shimmer" />
          <div className="h-32 rounded-3xl bg-white border border-slate-200 animate-pulse shimmer" />
          <div className="h-32 rounded-3xl bg-white border border-slate-200 animate-pulse shimmer" />
        </div>
      </div>
    </div>
  );
}

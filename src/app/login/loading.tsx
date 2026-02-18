export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-slate-100 to-white px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mx-auto h-10 w-40 rounded-2xl bg-slate-200/70 animate-pulse shimmer" />
        <div className="mt-4 h-5 w-2/3 rounded-xl bg-slate-200/70 animate-pulse shimmer" />
        <div className="mt-6 space-y-3">
          <div className="h-11 rounded-xl bg-slate-100 animate-pulse shimmer" />
          <div className="h-11 rounded-xl bg-slate-100 animate-pulse shimmer" />
          <div className="h-10 rounded-xl bg-slate-200/70 animate-pulse shimmer" />
        </div>
      </div>
    </div>
  );
}

export default function AppLoading() {
  return (
    <div className="flex-1 px-4 md:px-6 py-8 max-w-[1060px] w-full mx-auto space-y-5 animate-pulse">
      <div className="h-8 w-56 rounded-btn bg-line/70" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-28 rounded-card bg-white border border-line" />
        <div className="h-28 rounded-card bg-white border border-line" />
        <div className="h-28 rounded-card bg-white border border-line" />
        <div className="h-28 rounded-card bg-white border border-line" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-64 rounded-card bg-white border border-line" />
        <div className="h-64 rounded-card bg-white border border-line" />
      </div>
    </div>
  );
}

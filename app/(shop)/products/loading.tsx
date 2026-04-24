import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Filters bar skeleton */}
      <div className="bg-white border-b border-slate-100 sticky top-14 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3 animate-pulse overflow-x-auto">
            <div className="h-9 w-28 bg-slate-100 rounded-2xl shrink-0" />
            <div className="h-9 w-24 bg-slate-100 rounded-2xl shrink-0" />
            <div className="h-9 w-32 bg-slate-100 rounded-2xl shrink-0" />
            <div className="h-9 w-20 bg-slate-100 rounded-2xl shrink-0" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results count skeleton */}
        <div className="h-4 w-32 bg-slate-100 rounded-full animate-pulse mb-6" />

        <ProductGridSkeleton count={12} />
      </div>
    </div>
  );
}

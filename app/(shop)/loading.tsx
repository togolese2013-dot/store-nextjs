import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";

function SectionSkeleton({ count = 8 }: { count?: number }) {
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div className="space-y-2 animate-pulse">
            <div className="h-3 w-20 bg-slate-100 rounded-full" />
            <div className="h-7 w-48 bg-slate-100 rounded-full" />
            <div className="h-1 w-12 bg-slate-100 rounded-full" />
          </div>
        </div>
        <ProductGridSkeleton count={count} />
      </div>
    </section>
  );
}

export default function HomeLoading() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="w-full h-[420px] sm:h-[520px] lg:h-[600px] bg-slate-100 animate-pulse" />

      {/* Trust bar skeleton */}
      <div className="bg-white border-b border-slate-100 py-3 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                <div className="h-2.5 bg-slate-100 rounded-full w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <SectionSkeleton count={8} />
    </div>
  );
}

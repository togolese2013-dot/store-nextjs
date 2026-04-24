export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
      {/* Image */}
      <div className="aspect-square bg-slate-100" />

      {/* Content */}
      <div className="p-3.5 space-y-2.5">
        {/* Category */}
        <div className="h-2.5 w-16 bg-slate-100 rounded-full" />
        {/* Name line 1 */}
        <div className="h-3.5 w-full bg-slate-100 rounded-full" />
        {/* Name line 2 */}
        <div className="h-3.5 w-3/4 bg-slate-100 rounded-full" />
        {/* Price */}
        <div className="h-4 w-24 bg-slate-100 rounded-full mt-1" />
        {/* Button */}
        <div className="h-9 w-full bg-slate-100 rounded-md mt-1" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

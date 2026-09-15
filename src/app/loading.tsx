import React from "react";

export default function GlobalLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div className="space-y-3 max-w-lg">
        <div className="h-4 w-32 rounded-lg skeleton-shimmer" />
        <div className="h-8 w-64 rounded-xl skeleton-shimmer" />
        <div className="h-3 w-48 rounded-lg skeleton-shimmer" />
      </div>

      {/* Product Grid Skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-3xl bg-white border border-[#E5E5E5] p-3 sm:p-4 space-y-3 shadow-xs overflow-hidden"
          >
            {/* Image placeholder */}
            <div className="aspect-square w-full rounded-2xl skeleton-shimmer" />
            {/* Category tag */}
            <div className="h-3 w-20 rounded-md skeleton-shimmer" />
            {/* Title */}
            <div className="space-y-1.5">
              <div className="h-4 w-full rounded-md skeleton-shimmer" />
              <div className="h-4 w-2/3 rounded-md skeleton-shimmer" />
            </div>
            {/* Price & button */}
            <div className="pt-2 flex items-center justify-between">
              <div className="h-6 w-24 rounded-lg skeleton-shimmer" />
              <div className="h-8 w-8 rounded-full skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

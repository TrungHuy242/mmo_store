// Skeleton loading components — animate-pulse replacements for spinners
// Use these during data-fetch loading to give users a preview of the
// upcoming content layout rather than a generic spinner.

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`bg-bg-tertiary rounded animate-pulse ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card ${className}`}>
      <Skeleton className="aspect-product rounded-lg mb-4" />
      <Skeleton className="h-4 w-1/3 mb-2" />
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-1/4 rounded-lg" />
      </div>
    </div>
  );
}

// Generic table skeleton — pass the actual column count so the headers match
export function SkeletonTable({ rows = 6, cols = 5, className = '' }) {
  return (
    <div className={`bg-bg-secondary border border-border rounded-lg overflow-hidden ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {[...Array(cols)].map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border/50 last:border-0">
              {[...Array(cols)].map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <Skeleton
                    className="h-4 rounded"
                    style={{ width: `${60 + ((rowIndex * 7 + colIndex * 13) % 35)}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Grid skeleton — used for product listing pages
export function SkeletonGrid({ count = 8, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// Profile / avatar + name line
export function SkeletonProfile({ className = '' }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// Dashboard stat card — matches the shape of StatCard
export function SkeletonStatCard({ className = '' }) {
  return (
    <div className={`bg-[#111827] rounded-2xl border border-white/5 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="w-14 h-6 rounded-full" />
      </div>
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

// Dashboard chart card — matches the shape of ChartCard
export function SkeletonChartCard({ className = '' }) {
  return (
    <div className={`bg-[#111827] rounded-2xl border border-white/5 p-6 ${className}`}>
      <Skeleton className="h-5 w-36 mb-4" />
      <Skeleton className="w-full rounded-lg" style={{ height: 256 }} />
    </div>
  );
}

// Full-page centered loading — replaces generic spinner moments
export function SkeletonPage({ rows = 8, cols = 5, className = '' }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div className="w-full max-w-5xl">
        <SkeletonTable rows={rows} cols={cols} />
      </div>
    </div>
  );
}
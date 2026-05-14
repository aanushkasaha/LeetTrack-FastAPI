export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#2e2e2e] rounded ${className}`} />;
}
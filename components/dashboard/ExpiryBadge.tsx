interface Props { days: number }

export default function ExpiryBadge({ days }: Props) {
  if (days <= 3) {
    return (
      <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center justify-center gap-1.5 w-max animate-pulse">
        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
        RED ZONE
      </span>
    )
  }
  
  if (days <= 30) {
    return <span className="bg-yellow-100 border border-yellow-200 text-yellow-700 text-xs font-medium px-2.5 py-1 rounded-full">Expiring Soon</span>
  }
  
  return <span className="bg-green-100 border border-green-200 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">Safe</span>
}

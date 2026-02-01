'use client'

interface CreditsDisplayProps {
  credits: number
}

export default function CreditsDisplay({ credits }: CreditsDisplayProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
      <span className="text-sm font-medium text-indigo-700">Credits:</span>
      <span className="text-lg font-bold text-indigo-900">
        {credits.toFixed(4)}
      </span>
    </div>
  )
}

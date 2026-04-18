import { FileText } from "lucide-react"
import Link from "next/link"

interface Props {
  count: number
}

export function FilesCountWidget({ count }: Props) {
  return (
    <div className="flex items-center gap-4 h-full">
      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-slate-500" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{count}</p>
        <Link href="/files" className="text-xs text-slate-500 hover:text-emerald-600 transition-colors">
          Files processed
        </Link>
      </div>
    </div>
  )
}

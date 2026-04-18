"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Responsive } from "react-grid-layout"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLayouts = any
import { Settings2, X, GripVertical, Plus } from "lucide-react"
import { MoneyCardWidget } from "@/components/widgets/money-card-widget"
import { RecentTransactionsWidget } from "@/components/widgets/recent-transactions-widget"
import { TopSpendingWidget } from "@/components/widgets/top-spending-widget"
import { FilesCountWidget } from "@/components/widgets/files-count-widget"
import { SubscriptionsSummaryWidget } from "@/components/widgets/subscriptions-summary-widget"
import {
  AIInsightsWidget,
  AIInsightsWidgetHeader,
} from "@/components/widgets/ai-insights-widget"

// ─── Types ───────────────────────────────────────────────────────────────────

export type WidgetId =
  | "money-out"
  | "money-in"
  | "net"
  | "recent-tx"
  | "top-spending"
  | "ai-insights"
  | "subscriptions-summary"
  | "files-count"

export interface DashboardData {
  spent: number
  received: number
  net: number
  currency: string
  monthName: string
  recentTx: Array<{
    id: string
    merchantName: string | null
    description: string
    type: string
    amount: number
    date: string
  }>
  topMerchants: Array<{ merchantName: string | null; amount: number; pct: number }>
  fileCount: number
  subscriptionsCount: number
  totalMonthlySubscriptions: number
}

// ─── Layout defaults ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEFAULT_LAYOUTS: AnyLayouts = {
  lg: [
    { i: "money-out",             x: 0, y: 0,  w: 4, h: 3, minW: 3, minH: 3 },
    { i: "money-in",              x: 4, y: 0,  w: 4, h: 3, minW: 3, minH: 3 },
    { i: "net",                   x: 8, y: 0,  w: 4, h: 3, minW: 3, minH: 3 },
    { i: "recent-tx",             x: 0, y: 3,  w: 8, h: 7, minW: 4, minH: 4 },
    { i: "top-spending",          x: 8, y: 3,  w: 4, h: 7, minW: 3, minH: 4 },
    { i: "ai-insights",           x: 0, y: 10, w: 8, h: 6, minW: 4, minH: 4 },
    { i: "subscriptions-summary", x: 8, y: 10, w: 4, h: 6, minW: 3, minH: 4 },
    { i: "files-count",           x: 0, y: 16, w: 3, h: 3, minW: 2, minH: 3 },
  ],
  md: [
    { i: "money-out",             x: 0, y: 0,  w: 5, h: 3 },
    { i: "money-in",              x: 5, y: 0,  w: 5, h: 3 },
    { i: "net",                   x: 0, y: 3,  w: 5, h: 3 },
    { i: "files-count",           x: 5, y: 3,  w: 5, h: 3 },
    { i: "recent-tx",             x: 0, y: 6,  w: 10, h: 7 },
    { i: "top-spending",          x: 0, y: 13, w: 10, h: 6 },
    { i: "ai-insights",           x: 0, y: 19, w: 10, h: 6 },
    { i: "subscriptions-summary", x: 0, y: 25, w: 10, h: 5 },
  ],
}

const WIDGET_LABELS: Record<WidgetId, string | React.ReactNode> = {
  "money-out":             "Money Out",
  "money-in":              "Money In",
  "net":                   "Net",
  "recent-tx":             "Recent Transactions",
  "top-spending":          "Top Spending",
  "ai-insights":           <AIInsightsWidgetHeader />,
  "subscriptions-summary": "Subscriptions",
  "files-count":           "Files Processed",
}

const ALL_WIDGETS: WidgetId[] = [
  "money-out", "money-in", "net",
  "recent-tx", "top-spending",
  "ai-insights", "subscriptions-summary",
  "files-count",
]

const STORAGE_KEY = "expensable-dashboard-v1"

// ─── Persistence ─────────────────────────────────────────────────────────────

function loadState(): { layouts: AnyLayouts; hidden: WidgetId[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { layouts: DEFAULT_LAYOUTS, hidden: [] }
}

function saveState(layouts: AnyLayouts, hidden: WidgetId[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ layouts, hidden }))
  } catch {}
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  data: DashboardData
}

export function DashboardGrid({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1200)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [layouts, setLayouts] = useState<AnyLayouts>(DEFAULT_LAYOUTS)
  const [hidden, setHidden] = useState<WidgetId[]>([])
  const [editMode, setEditMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Measure container width
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0]?.contentRect.width ?? 1200)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Load from localStorage (client-only)
  useEffect(() => {
    const stored = loadState()
    setLayouts(stored.layouts)
    setHidden(stored.hidden)
    setMounted(true)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onLayoutChange = useCallback((_current: any, all: AnyLayouts) => {
    setLayouts(all)
    saveState(all, hidden)
  }, [hidden])

  function hideWidget(id: WidgetId) {
    const next = [...hidden, id]
    setHidden(next)
    saveState(layouts, next)
  }

  function showWidget(id: WidgetId) {
    const next = hidden.filter((h) => h !== id)
    setHidden(next)
    saveState(layouts, next)
  }

  function resetLayout() {
    setLayouts(DEFAULT_LAYOUTS)
    setHidden([])
    saveState(DEFAULT_LAYOUTS, [])
  }

  const visible = ALL_WIDGETS.filter((id) => !hidden.includes(id))

  // SSR / pre-mount skeleton
  if (!mounted) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div />
        <div className="flex items-center gap-2">
          {editMode && (
            <button
              onClick={resetLayout}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Reset layout
            </button>
          )}
          <button
            onClick={() => setEditMode((e) => !e)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              editMode
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            {editMode ? "Done" : "Customize"}
          </button>
        </div>
      </div>

      {/* Hidden widgets tray */}
      {editMode && hidden.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-xs text-slate-400 self-center">Hidden:</span>
          {hidden.map((id) => (
            <button
              key={id}
              onClick={() => showWidget(id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
            >
              <Plus className="w-3 h-3" />
              {typeof WIDGET_LABELS[id] === "string" ? WIDGET_LABELS[id] : id}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div ref={containerRef}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Responsive
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 768 }}
          cols={{ lg: 12, md: 10 }}
          rowHeight={60}
          width={width}
          margin={[16, 16] as [number, number]}
          containerPadding={[0, 0] as [number, number]}
          {...({ isDraggable: editMode, isResizable: editMode } as any)}
          draggableHandle=".wdg-handle"
          onLayoutChange={onLayoutChange}
          resizeHandles={["se"] as any}
        >
          {visible.map((id) => (
            <div key={id} className="group">
              <WidgetShell
                id={id}
                label={WIDGET_LABELS[id]}
                editMode={editMode}
                onHide={() => hideWidget(id)}
              >
                <WidgetContent id={id} data={data} />
              </WidgetShell>
            </div>
          ))}
        </Responsive>
      </div>
    </div>
  )
}

// ─── Widget Shell ─────────────────────────────────────────────────────────────

function WidgetShell({
  id,
  label,
  editMode,
  onHide,
  children,
}: {
  id: WidgetId
  label: React.ReactNode
  editMode: boolean
  onHide: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className={`h-full bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden transition-colors ${
        editMode ? "border-emerald-200 ring-1 ring-emerald-100" : "border-slate-100"
      }`}
    >
      <div
        className={`flex items-center justify-between px-5 py-3 border-b border-slate-50 shrink-0 ${
          editMode ? "wdg-handle cursor-grab active:cursor-grabbing select-none" : ""
        }`}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          {editMode && <GripVertical className="w-3.5 h-3.5 text-slate-300" />}
          {label}
        </div>
        {editMode && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onHide}
            className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-hidden px-5 py-4 min-h-0">{children}</div>
    </div>
  )
}

// ─── Widget Content ───────────────────────────────────────────────────────────

function WidgetContent({ id, data }: { id: WidgetId; data: DashboardData }) {
  switch (id) {
    case "money-out":
      return (
        <MoneyCardWidget
          variant="out"
          amount={data.spent}
          currency={data.currency}
          monthName={data.monthName}
        />
      )
    case "money-in":
      return (
        <MoneyCardWidget
          variant="in"
          amount={data.received}
          currency={data.currency}
          monthName={data.monthName}
        />
      )
    case "net":
      return (
        <MoneyCardWidget
          variant="net"
          amount={data.net}
          currency={data.currency}
          monthName={data.monthName}
        />
      )
    case "recent-tx":
      return (
        <RecentTransactionsWidget
          transactions={data.recentTx}
          currency={data.currency}
        />
      )
    case "top-spending":
      return (
        <TopSpendingWidget
          merchants={data.topMerchants}
          currency={data.currency}
          monthName={data.monthName}
        />
      )
    case "ai-insights":
      return <AIInsightsWidget />
    case "subscriptions-summary":
      return (
        <SubscriptionsSummaryWidget
          count={data.subscriptionsCount}
          totalMonthly={data.totalMonthlySubscriptions}
          currency={data.currency}
        />
      )
    case "files-count":
      return <FilesCountWidget count={data.fileCount} />
    default:
      return null
  }
}

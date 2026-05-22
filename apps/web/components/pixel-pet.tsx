"use client"

import { useEffect, useState } from "react"

const S = 4 // px per pixel

const C: Record<number, string> = {
  0: "transparent",
  1: "#E8864A", // orange fur
  2: "#2C1406", // dark outline
  3: "#F5C27A", // light cheeks
  4: "#FF9EB5", // pink (ears + nose)
  5: "#FFFFFF", // white eye highlight
  6: "#C96B3A", // tabby stripe
  7: "#4A6FE8", // blue eyes
}

const IDLE: number[][] = [
  [0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0],
  [0, 1, 2, 0, 0, 0, 0, 0, 0, 2, 1, 0],
  [2, 1, 4, 2, 0, 0, 0, 0, 2, 4, 1, 2],
  [1, 1, 1, 1, 2, 0, 0, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 3, 1, 1, 1, 1, 1, 1, 3, 1, 1],
  [1, 1, 5, 7, 1, 1, 1, 1, 7, 5, 1, 1],
  [1, 1, 2, 7, 7, 1, 1, 7, 7, 2, 1, 1],
  [1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1],
  [1, 1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 1],
  [1, 1, 1, 2, 1, 4, 4, 1, 2, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [2, 1, 1, 6, 1, 1, 1, 6, 1, 1, 1, 2],
  [0, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 0],
  [0, 1, 1, 6, 1, 1, 1, 6, 1, 1, 1, 0],
  [0, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 0],
  [0, 0, 2, 1, 1, 0, 0, 1, 1, 2, 0, 0],
  [0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0],
]

const BLINK: number[][] = [
  ...IDLE.slice(0, 6),
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ...IDLE.slice(9),
]

const TIPS = [
  "Meow! Save more!",
  "Budget = freedom!",
  "Track every penny!",
  "Stay in the green!",
  "Future you says thanks!",
  "Subscriptions add up!",
]

export function PixelPet() {
  const [blink, setBlink] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [tipIdx, setTipIdx] = useState(0)

  useEffect(() => {
    let id: ReturnType<typeof setTimeout>
    const loop = () => {
      id = setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 120)
        loop()
      }, 3000 + Math.random() * 3000)
    }
    loop()
    return () => clearTimeout(id)
  }, [])

  const pixels = blink ? BLINK : IDLE
  const W = pixels[0].length * S
  const H = pixels.length * S

  return (
    <div className="flex flex-col items-center py-3 border-t border-slate-800/50">
      <div
        className="relative cursor-pointer"
        onMouseEnter={() => {
          setTipIdx(i => (i + 1) % TIPS.length)
          setShowTip(true)
        }}
        onMouseLeave={() => setShowTip(false)}
      >
        {showTip && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] rounded-lg px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
            {TIPS[tipIdx]}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-emerald-800" />
          </div>
        )}
        <svg
          width={W}
          height={H}
          style={{ imageRendering: "pixelated" }}
          className="transition-transform hover:scale-110 hover:-translate-y-0.5 duration-200"
        >
          {pixels.flatMap((row, y) =>
            row.map((c, x) =>
              c === 0 ? null : (
                <rect
                  key={`${x},${y}`}
                  x={x * S}
                  y={y * S}
                  width={S}
                  height={S}
                  fill={C[c]}
                />
              )
            )
          )}
        </svg>
      </div>
      <span className="mt-1 text-[9px] text-slate-600 font-medium tracking-widest uppercase">
        Penny
      </span>
    </div>
  )
}

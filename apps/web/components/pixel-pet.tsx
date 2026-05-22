"use client"

import { useEffect, useRef, useState } from "react"

const S = 4

const C: Record<number, string> = {
  0: "transparent",
  1: "#E8864A",
  2: "#2C1406",
  3: "#F5C27A",
  4: "#FF9EB5",
  5: "#FFFFFF",
  6: "#C96B3A",
  7: "#4A6FE8",
}

const HEAD: number[][] = [
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
]

const HEAD_BLINK: number[][] = [
  ...HEAD.slice(0, 6),
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ...HEAD.slice(9),
]

// Sitting legs
const LEGS_IDLE: number[][] = [
  [0, 0, 2, 1, 1, 0, 0, 1, 1, 2, 0, 0],
  [0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0],
]

// Walk frame A — legs spread
const LEGS_WALK_A: number[][] = [
  [0, 2, 1, 1, 0, 0, 0, 0, 1, 1, 2, 0],
  [0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0],
]

// Walk frame B — legs tucked
const LEGS_WALK_B: number[][] = [
  [0, 0, 0, 2, 1, 0, 0, 1, 2, 0, 0, 0],
  [0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0],
]

const TIPS = [
  "Meow! Save more!",
  "Budget = freedom!",
  "Track every penny!",
  "Stay in the green!",
  "Future you says thanks!",
  "Subscriptions add up!",
]

const CAT_W = 12 * S  // 48px
const CAT_H = 19 * S  // 76px
const AREA_W = 192
const MAX_X = AREA_W - CAT_W  // 144px

export function PixelPet() {
  const [blink, setBlink] = useState(false)
  const [walking, setWalking] = useState(false)
  const [walkFrame, setWalkFrame] = useState(0)
  const [posX, setPosX] = useState(Math.floor(MAX_X / 2))
  const [dir, setDir] = useState(1)
  const [showTip, setShowTip] = useState(false)
  const [tipIdx, setTipIdx] = useState(0)

  const dirRef = useRef(1)
  dirRef.current = dir

  // Blink
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

  // Toggle walk / idle
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>
    const toggle = (isWalking: boolean) => {
      const delay = isWalking
        ? 2500 + Math.random() * 2000
        : 3000 + Math.random() * 4000
      id = setTimeout(() => {
        setWalking(!isWalking)
        if (isWalking) setWalkFrame(0)
        toggle(!isWalking)
      }, delay)
    }
    toggle(false)
    return () => clearTimeout(id)
  }, [])

  // Walk movement interval
  useEffect(() => {
    if (!walking) return
    const id = setInterval(() => {
      setWalkFrame(f => (f + 1) % 2)
      setPosX(prev => {
        const next = prev + dirRef.current * 2
        if (next >= MAX_X) { setDir(-1); return MAX_X }
        if (next <= 0)      { setDir(1);  return 0 }
        return next
      })
    }, 150)
    return () => clearInterval(id)
  }, [walking])

  const headRows = blink ? HEAD_BLINK : HEAD
  const legRows  = walking
    ? (walkFrame === 0 ? LEGS_WALK_A : LEGS_WALK_B)
    : LEGS_IDLE
  const pixels = [...headRows, ...legRows]

  return (
    <div className="py-3 border-t border-slate-800/50 flex flex-col items-center gap-1">
      <div
        className="relative cursor-pointer"
        style={{ width: AREA_W, height: CAT_H + 8 }}
        onMouseEnter={() => {
          setTipIdx(i => (i + 1) % TIPS.length)
          setShowTip(true)
        }}
        onMouseLeave={() => setShowTip(false)}
      >
        {showTip && (
          <div
            className="absolute bottom-full mb-1 bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] rounded-lg px-2 py-1 whitespace-nowrap z-10 pointer-events-none"
            style={{ left: posX + CAT_W / 2, transform: "translateX(-50%)" }}
          >
            {TIPS[tipIdx]}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-emerald-800" />
          </div>
        )}
        <svg
          width={CAT_W}
          height={CAT_H}
          style={{
            imageRendering: "pixelated",
            position: "absolute",
            bottom: 0,
            left: 0,
            transform: `translateX(${posX}px) scaleX(${dir === -1 ? -1 : 1})`,
            transformOrigin: `${CAT_W / 2}px center`,
          }}
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
      <span className="text-[9px] text-slate-600 font-medium tracking-widest uppercase">
        Penny
      </span>
    </div>
  )
}

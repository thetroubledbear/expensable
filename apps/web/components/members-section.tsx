"use client"

import { useState } from "react"
import { Users, Link2, Check, Trash2, Loader2, Crown, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"

interface Member {
  id: string
  userId: string
  role: string
  joinedAt: string
  name: string | null
  email: string | null
}

interface Props {
  members: Member[]
  isOwner: boolean
  maxMembers: number
}

export function MembersSection({ members, isOwner, maxMembers }: Props) {
  const router = useRouter()
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [promotingId, setPromotingId] = useState<string | null>(null)

  async function generateInvite() {
    setGenerating(true)
    setInviteError("")
    const res = await fetch("/api/household/invites", { method: "POST" })
    const data = await res.json()
    if (!res.ok) {
      setInviteError(data.error ?? "Failed to generate invite")
      setGenerating(false)
      return
    }
    const url = `${window.location.origin}/invite/${data.token}`
    setInviteUrl(url)
    setGenerating(false)
  }

  async function copyInvite() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function removeMember(memberId: string) {
    setRemovingId(memberId)
    const res = await fetch(`/api/household/members/${memberId}`, { method: "DELETE" })
    if (res.ok) router.refresh()
    setRemovingId(null)
  }

  async function promoteMember(memberId: string) {
    setPromotingId(memberId)
    const res = await fetch(`/api/household/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "owner" }),
    })
    if (res.ok) router.refresh()
    setPromotingId(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Members</h2>
          <span className="text-xs text-slate-400">
            {members.length}/{maxMembers}
          </span>
        </div>
        {isOwner && members.length < maxMembers && (
          <button
            onClick={generateInvite}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Link2 className="w-3.5 h-3.5" />
            )}
            Invite
          </button>
        )}
      </div>

      {inviteError && <p className="text-xs text-red-500 mb-3">{inviteError}</p>}

      {inviteUrl && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-600 truncate flex-1 font-mono">{inviteUrl}</p>
          <button
            onClick={copyInvite}
            className="shrink-0 flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-slate-600">
                  {((m.name ?? m.email ?? "?")[0]).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {m.name ?? m.email}
                  </p>
                  {m.role === "owner" && (
                    <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                  )}
                </div>
                {m.name && (
                  <p className="text-xs text-slate-400 truncate">{m.email}</p>
                )}
              </div>
            </div>
            {isOwner && m.role !== "owner" && (
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => promoteMember(m.id)}
                  disabled={promotingId === m.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 disabled:opacity-50 transition-colors"
                  title="Make admin"
                >
                  {promotingId === m.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => removeMember(m.id)}
                  disabled={removingId === m.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  title="Remove member"
                >
                  {removingId === m.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

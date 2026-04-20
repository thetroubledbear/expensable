// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = "owner" | "member"

export interface HouseholdMember {
  id: string
  userId: string
  householdId: string
  role: UserRole
  joinedAt: Date
}

// ─── Files ───────────────────────────────────────────────────────────────────

export type FileType = "csv" | "pdf" | "image"
export type FileStatus = "pending" | "processing" | "done" | "failed"

export interface UploadedFile {
  id: string
  userId: string
  householdId: string
  name: string
  type: FileType
  status: FileStatus
  storageKey: string
  uploadedAt: Date
  processedAt?: Date
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export type TransactionType = "debit" | "credit"

export interface Transaction {
  id: string
  householdId: string
  fileId: string
  date: Date
  description: string
  amount: number
  currency: string
  type: TransactionType
  categoryId?: string
  merchantName?: string
  needsReview: boolean
  createdAt: Date
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  isSystem: boolean
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export interface DetectedSubscription {
  id: string
  householdId: string
  merchantName: string
  amount: number
  currency: string
  frequency: "monthly" | "annual" | "weekly"
  categoryId?: string
  firstSeenAt: Date
  lastSeenAt: Date
}

// ─── Plans / Billing ─────────────────────────────────────────────────────────

export type PlanTier = "free" | "pro" | "family"

export interface Plan {
  tier: PlanTier
  monthlyFileLimit: number
  maxHouseholdMembers: number
  monthlyAIQueryLimit: number | null // null = unlimited
}

export const PLANS: Record<PlanTier, Plan> = {
  free:   { tier: "free",   monthlyFileLimit: 25,   maxHouseholdMembers: 1, monthlyAIQueryLimit: 10 },
  pro:    { tier: "pro",    monthlyFileLimit: 60,    maxHouseholdMembers: 1, monthlyAIQueryLimit: 100 },
  family: { tier: "family", monthlyFileLimit: 1000,  maxHouseholdMembers: 6, monthlyAIQueryLimit: null },
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

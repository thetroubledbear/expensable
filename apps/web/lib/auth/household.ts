import { db } from "@expensable/db"

/**
 * Resolves the "active" household for a user.
 * Priority: family-tier household where user is a member (invited) >
 *           family-tier household where user is owner >
 *           first membership (own household)
 * This ensures invited family members see the family household, not their own.
 */
export async function resolveHousehold(userId: string) {
  const memberships = await db.householdMember.findMany({
    where: { userId },
    include: { household: { include: { billing: true } } },
    orderBy: { joinedAt: "asc" },
  })

  if (!memberships.length) return null

  const familyMember = memberships.find(
    (m) => m.household.billing?.tier === "family" && m.role === "member"
  )
  const familyOwner = memberships.find(
    (m) => m.household.billing?.tier === "family" && m.role === "owner"
  )

  return familyMember ?? familyOwner ?? memberships[0]
}

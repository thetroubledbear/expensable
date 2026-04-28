import type { CollectionConfig } from "payload"

export const CMSUsers: CollectionConfig = {
  slug: "cms-users",
  admin: { useAsTitle: "email" },
  auth: true,
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
}

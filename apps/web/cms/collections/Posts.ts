import type { CollectionConfig } from "payload"

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: { useAsTitle: "title" },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "status",
      type: "select",
      options: ["draft", "published"],
      defaultValue: "draft",
      required: true,
    },
    {
      name: "excerpt",
      type: "textarea",
      admin: { description: "Short summary shown in blog index" },
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    {
      name: "publishedAt",
      type: "date",
      admin: { date: { pickerAppearance: "dayAndTime" } },
    },
    {
      name: "author",
      type: "text",
    },
    {
      name: "tags",
      type: "array",
      fields: [{ name: "tag", type: "text" }],
    },
    {
      name: "seo",
      type: "group",
      fields: [
        { name: "title", type: "text" },
        { name: "description", type: "textarea" },
        { name: "ogImage", type: "upload", relationTo: "media" },
      ],
    },
  ],
}

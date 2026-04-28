import type { CollectionConfig } from "payload"

export const Pages: CollectionConfig = {
  slug: "pages",
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
      admin: { description: "URL path: /about → slug: about" },
    },
    {
      name: "status",
      type: "select",
      options: ["draft", "published"],
      defaultValue: "draft",
      required: true,
    },
    {
      name: "content",
      type: "richText",
    },
    {
      name: "layout",
      type: "blocks",
      blocks: [
        {
          slug: "hero",
          fields: [
            { name: "heading", type: "text" },
            { name: "subheading", type: "textarea" },
            { name: "ctaLabel", type: "text" },
            { name: "ctaUrl", type: "text" },
            { name: "image", type: "upload", relationTo: "media" },
          ],
        },
        {
          slug: "richText",
          fields: [{ name: "content", type: "richText" }],
        },
        {
          slug: "cta",
          fields: [
            { name: "heading", type: "text" },
            { name: "subheading", type: "text" },
            { name: "primaryLabel", type: "text" },
            { name: "primaryUrl", type: "text" },
            { name: "secondaryLabel", type: "text" },
            { name: "secondaryUrl", type: "text" },
          ],
        },
        {
          slug: "featureGrid",
          fields: [
            { name: "heading", type: "text" },
            {
              name: "features",
              type: "array",
              fields: [
                { name: "title", type: "text" },
                { name: "description", type: "textarea" },
                { name: "icon", type: "text", admin: { description: "Lucide icon name" } },
              ],
            },
          ],
        },
      ],
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

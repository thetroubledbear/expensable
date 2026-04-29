import type { CollectionConfig } from "payload"

export const Notices: CollectionConfig = {
  slug: "notices",
  admin: { useAsTitle: "title" },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "body",
      type: "textarea",
      required: true,
      admin: { description: "The message shown to users" },
    },
    {
      name: "type",
      type: "select",
      options: [
        { label: "Banner (top of page)", value: "banner" },
        { label: "Modal (popup)", value: "modal" },
        { label: "Toast (brief notification)", value: "toast" },
      ],
      defaultValue: "banner",
      required: true,
    },
    {
      name: "target",
      type: "select",
      options: [
        { label: "Both web & mobile", value: "both" },
        { label: "Web only", value: "web" },
        { label: "Mobile only", value: "mobile" },
      ],
      defaultValue: "both",
      required: true,
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Toggle without deleting" },
    },
    {
      name: "expiresAt",
      type: "date",
      admin: {
        description: "Leave empty for no expiry",
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    {
      name: "cta",
      type: "group",
      admin: { description: "Optional button inside the notice" },
      fields: [
        { name: "label", type: "text", admin: { description: "Button text" } },
        { name: "url", type: "text", admin: { description: "Link URL (absolute or relative)" } },
      ],
    },
    {
      name: "variant",
      type: "select",
      options: [
        { label: "Info (blue)", value: "info" },
        { label: "Warning (amber)", value: "warning" },
        { label: "Success (green)", value: "success" },
        { label: "Danger (red)", value: "danger" },
      ],
      defaultValue: "info",
    },
  ],
}

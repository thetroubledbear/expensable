import type { GlobalConfig } from "payload"

export const HomePage: GlobalConfig = {
  slug: "home-page",
  admin: { group: "Content" },
  fields: [
    {
      name: "hero",
      type: "group",
      fields: [
        { name: "badge", type: "text", defaultValue: "AI-Powered Expense Tracking" },
        { name: "headline", type: "text", defaultValue: "Stop guessing where your money goes" },
        { name: "headlineHighlight", type: "text", defaultValue: "money goes", admin: { description: "Part of headline rendered in emerald" } },
        { name: "subheadline", type: "textarea", defaultValue: "Upload bank statements, receipts, and CSV exports. Our AI extracts every transaction automatically — no manual entry, no spreadsheets." },
        { name: "ctaPrimary", type: "text", defaultValue: "Start for free" },
        { name: "ctaSecondary", type: "text", defaultValue: "Sign in" },
        { name: "trustLine", type: "text", defaultValue: "Free plan available · No credit card required" },
      ],
    },
    {
      name: "featuresSection",
      type: "group",
      fields: [
        { name: "heading", type: "text", defaultValue: "Everything you need, nothing you don't" },
        { name: "subheading", type: "textarea", defaultValue: "Built for people who want real insight into their finances without the spreadsheet headache." },
        {
          name: "features",
          type: "array",
          fields: [
            { name: "title", type: "text" },
            { name: "description", type: "textarea" },
            {
              name: "icon",
              type: "select",
              options: [
                { label: "Brain Circuit", value: "BrainCircuit" },
                { label: "Users", value: "Users" },
                { label: "Folder Open", value: "FolderOpen" },
                { label: "Bar Chart", value: "BarChart3" },
                { label: "Shield", value: "Shield" },
                { label: "Zap", value: "Zap" },
              ],
            },
            {
              name: "iconColor",
              type: "select",
              options: [
                { label: "Violet", value: "violet" },
                { label: "Sky", value: "sky" },
                { label: "Amber", value: "amber" },
                { label: "Emerald", value: "emerald" },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "stepsSection",
      type: "group",
      fields: [
        { name: "heading", type: "text", defaultValue: "From upload to insight in seconds" },
        {
          name: "steps",
          type: "array",
          fields: [
            { name: "title", type: "text" },
            { name: "description", type: "textarea" },
          ],
        },
      ],
    },
    {
      name: "ctaSection",
      type: "group",
      fields: [
        { name: "heading", type: "text", defaultValue: "Start tracking today" },
        { name: "subheading", type: "textarea", defaultValue: "Free plan included. Upgrade to Pro or Family when you need more." },
        { name: "ctaPrimary", type: "text", defaultValue: "Create free account" },
        { name: "ctaSecondary", type: "text", defaultValue: "Already have an account" },
        {
          name: "trustItems",
          type: "array",
          fields: [{ name: "text", type: "text" }],
        },
      ],
    },
    {
      name: "seo",
      type: "group",
      fields: [
        { name: "title", type: "text", defaultValue: "Expensable — AI-Powered Expense Tracking" },
        { name: "description", type: "textarea", defaultValue: "Smart expense tracking for individuals and families. Upload any file, AI extracts every transaction automatically." },
        { name: "ogImage", type: "upload", relationTo: "media" },
      ],
    },
  ],
}

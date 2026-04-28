import { buildConfig } from "payload"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { gcsStorage } from "@payloadcms/storage-gcs"
import path from "path"
import { CMSUsers } from "./cms/collections/CMSUsers.ts"
import { Media } from "./cms/collections/Media.ts"
import { Pages } from "./cms/collections/Pages.ts"
import { Posts } from "./cms/collections/Posts.ts"
import { Notices } from "./cms/collections/Notices.ts"
import { HomePage } from "./cms/globals/HomePage.ts"

export default buildConfig({
  admin: {
    user: CMSUsers.slug,
    importMap: { baseDir: path.resolve(".") },
    meta: { titleSuffix: " | ExpCMS" },
  },
  routes: {
    admin: "/expcms",
    api: "/cms-api",
  },
  collections: [CMSUsers, Media, Pages, Posts, Notices],
  globals: [HomePage],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
    },
    migrationDir: path.resolve("cms/migrations"),
    push: true,
    // Restrict schema introspection to Payload-owned tables only.
    // Without this, drizzle-kit sees all Prisma tables and asks interactive
    // rename questions when creating Payload tables → hangs in serverless.
    tablesFilter: ["cms_*", "payload_*", "media", "media_*", "pages", "pages_*", "posts", "posts_*", "notices", "notices_*", "home_page", "home_page_*"],
  }),
  secret: process.env.PAYLOAD_SECRET ?? "change-me-in-production",
  typescript: {
    outputFile: path.resolve("cms/payload-types.ts"),
  },
  plugins: [
    gcsStorage({
      collections: { media: true },
      bucket: process.env.GCS_BUCKET ?? "expensable",
      options: {
        credentials: process.env.GCS_SERVICE_ACCOUNT_KEY
          ? (JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY) as object)
          : undefined,
      },
    }),
  ],
})

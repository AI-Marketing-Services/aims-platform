import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/portal/", "/admin/", "/intern/", "/reseller/", "/api/", "/sign-in", "/sign-up"],
      },
    ],
    sitemap: "https://aimseos.com/sitemap.xml",
  }
}

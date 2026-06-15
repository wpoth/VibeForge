import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://your-domain.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/app/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
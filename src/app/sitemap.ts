import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();
    const routes = ["/", "/browse", "/post", "/login", "/privacy", "/terms"];

    return routes.map((path) => ({
        url: `${APP_URL}${path}`,
        lastModified,
        changeFrequency: "weekly",
        priority: path === "/" ? 1 : 0.7,
    }));
}

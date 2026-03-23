import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Simple query to fetch educators from the database
export const list = query({
    args: {},
    handler: async (ctx) => {
        const educators = await ctx.db.query("educators").order("desc").collect();
        return await Promise.all(
            educators.map(async (educator) => {
                const user = await ctx.db.get(educator.userId);
                return {
                    ...educator,
                    user: user!,
                };
            })
        );
    },
});

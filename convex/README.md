# Welcome to your Convex functions directory!

Write your Convex functions here.
See https://docs.convex.dev/functions for more.

A query function that takes two arguments looks like:

```ts
// convex/myFunctions.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myQueryFunction = query({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Read the database as many times as you need here.
    // See https://docs.convex.dev/database/reading-data.
    const documents = await ctx.db.query("tablename").collect();

    // Arguments passed from the client are properties of the args object.
    console.log(args.first, args.second);

    // Write arbitrary JavaScript here: filter, aggregate, build derived data,
    // remove non-public properties, or create new objects.
    return documents;
  },
});
```

Using this query function in a React component looks like:

```ts
const data = useQuery(api.myFunctions.myQueryFunction, {
  first: 10,
  second: "hello",
});
```

A mutation function looks like:

```ts
// convex/myFunctions.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const myMutationFunction = mutation({
  // Validators for arguments.
  args: {
    first: v.string(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Insert or modify documents in the database here.
    // Mutations can also read from the database like queries.
    // See https://docs.convex.dev/database/writing-data.
    const message = { body: args.first, author: args.second };
    const id = await ctx.db.insert("messages", message);

    // Optionally, return a value from your mutation.
    return await ctx.db.get("messages", id);
  },
});
```

Using this mutation function in a React component looks like:

```ts
const mutation = useMutation(api.myFunctions.myMutationFunction);
function handleButtonPress() {
  // fire and forget, the most common way to use mutations
  mutation({ first: "Hello!", second: "me" });
  // OR
  // use the result once the mutation has completed
  mutation({ first: "Hello!", second: "me" }).then((result) =>
    console.log(result),
  );
}
```

Use the Convex CLI to push your functions to a deployment. See everything
the Convex CLI can do by running `npx convex -h` in your project root
directory. To learn more, launch the docs with `npx convex docs`.

---

## Local development (required for `users:viewer` and other functions)

The Next.js app calls Convex using `NEXT_PUBLIC_CONVEX_URL`. If you see:

> **Could not find public function for `users:viewer`. Did you forget to run `npx convex dev` or `npx convex deploy`?**

then the deployment at that URL does not have your latest functions pushed yet.

1. **Terminal 1 — sync functions & DB to your dev deployment**

   ```bash
   npm run convex:dev
   ```

   (`convex dev` watches `convex/` and pushes changes. It also updates `.env.local` with the correct `CONVEX_URL` / deployment URL when linked.)

2. **Terminal 2 — run the app**

   ```bash
   npm run dev
   ```

3. **First-time setup:** run `npx convex dev` once and log in / link this folder to your Convex project if prompted.

4. **Production / preview:** after changing Convex code, run `npm run convex:deploy` (or `npx convex deploy`) so the deployment behind `NEXT_PUBLIC_CONVEX_URL` includes `users.ts`.

---

## Production / Vercel checklist

1. **Deploy functions:** `npx convex deploy` (use `--prod` / production deployment as documented in Convex).
2. **Environment variables (Vercel):** set `NEXT_PUBLIC_CONVEX_URL` to your production Convex URL, plus Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) and app URL.
3. **Clerk ↔ Convex:** configure Convex to validate Clerk JWTs so `ctx.auth.getUserIdentity()` works in production (`users.viewer`, onboarding, `educators.listForBrowse`, etc.).
4. **Browse data:** optional `NEXT_PUBLIC_USE_CONVEX_BROWSE=true` so district-signed-in users load the directory from Convex; otherwise the UI uses demo mocks.
5. **Seed data (dev only):** run `npx convex run seed:populate` against a dev deployment if you need sample educators; do not expose unauthenticated admin mutations in production.

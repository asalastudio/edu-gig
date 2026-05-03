/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as credentials from "../credentials.js";
import type * as dashboards from "../dashboards.js";
import type * as districts from "../districts.js";
import type * as educators from "../educators.js";
import type * as emails from "../emails.js";
import type * as gigs from "../gigs.js";
import type * as messages from "../messages.js";
import type * as needs from "../needs.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as pricing from "../pricing.js";
import type * as procurement from "../procurement.js";
import type * as proposals from "../proposals.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  credentials: typeof credentials;
  dashboards: typeof dashboards;
  districts: typeof districts;
  educators: typeof educators;
  emails: typeof emails;
  gigs: typeof gigs;
  messages: typeof messages;
  needs: typeof needs;
  notifications: typeof notifications;
  orders: typeof orders;
  pricing: typeof pricing;
  procurement: typeof procurement;
  proposals: typeof proposals;
  reviews: typeof reviews;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

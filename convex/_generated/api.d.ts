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
import type * as beta_founding_profiles from "../beta_founding_profiles.js";
import type * as beta_launch from "../beta_launch.js";
import type * as contracts from "../contracts.js";
import type * as credentials from "../credentials.js";
import type * as crons from "../crons.js";
import type * as dashboards from "../dashboards.js";
import type * as demo_seed_constants from "../demo_seed_constants.js";
import type * as districts from "../districts.js";
import type * as educators from "../educators.js";
import type * as emails from "../emails.js";
import type * as engagements from "../engagements.js";
import type * as gigs from "../gigs.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_createEngagement from "../lib/createEngagement.js";
import type * as lib_customFunctions from "../lib/customFunctions.js";
import type * as lib_onboardingPolicy from "../lib/onboardingPolicy.js";
import type * as lib_proposalAcceptance from "../lib/proposalAcceptance.js";
import type * as lib_staging from "../lib/staging.js";
import type * as lib_time from "../lib/time.js";
import type * as lib_validators from "../lib/validators.js";
import type * as messages from "../messages.js";
import type * as needs from "../needs.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as pricing from "../pricing.js";
import type * as procurement from "../procurement.js";
import type * as proposals from "../proposals.js";
import type * as qa from "../qa.js";
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
  beta_founding_profiles: typeof beta_founding_profiles;
  beta_launch: typeof beta_launch;
  contracts: typeof contracts;
  credentials: typeof credentials;
  crons: typeof crons;
  dashboards: typeof dashboards;
  demo_seed_constants: typeof demo_seed_constants;
  districts: typeof districts;
  educators: typeof educators;
  emails: typeof emails;
  engagements: typeof engagements;
  gigs: typeof gigs;
  "lib/auth": typeof lib_auth;
  "lib/createEngagement": typeof lib_createEngagement;
  "lib/customFunctions": typeof lib_customFunctions;
  "lib/onboardingPolicy": typeof lib_onboardingPolicy;
  "lib/proposalAcceptance": typeof lib_proposalAcceptance;
  "lib/staging": typeof lib_staging;
  "lib/time": typeof lib_time;
  "lib/validators": typeof lib_validators;
  messages: typeof messages;
  needs: typeof needs;
  notifications: typeof notifications;
  orders: typeof orders;
  pricing: typeof pricing;
  procurement: typeof procurement;
  proposals: typeof proposals;
  qa: typeof qa;
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

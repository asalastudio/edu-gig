import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { mutation, query } from "../_generated/server";
import { getCurrentUser, requireDistrict, requireEducator } from "./auth";

export const authedQuery = customQuery(query, {
    args: {},
    input: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        return { ctx: { ...ctx, user }, args };
    },
});

export const authedMutation = customMutation(mutation, {
    args: {},
    input: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        return { ctx: { ...ctx, user }, args };
    },
});

export const educatorQuery = customQuery(query, {
    args: {},
    input: async (ctx, args) => {
        const user = await requireEducator(ctx);
        return { ctx: { ...ctx, user }, args };
    },
});

export const educatorMutation = customMutation(mutation, {
    args: {},
    input: async (ctx, args) => {
        const user = await requireEducator(ctx);
        return { ctx: { ...ctx, user }, args };
    },
});

export const districtQuery = customQuery(query, {
    args: {},
    input: async (ctx, args) => {
        const user = await requireDistrict(ctx);
        return { ctx: { ...ctx, user }, args };
    },
});

export const districtMutation = customMutation(mutation, {
    args: {},
    input: async (ctx, args) => {
        const user = await requireDistrict(ctx);
        return { ctx: { ...ctx, user }, args };
    },
});

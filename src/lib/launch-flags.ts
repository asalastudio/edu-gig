export type LaunchEnv = Partial<
    Record<
        "NEXT_PUBLIC_ENABLE_CARD_CHECKOUT" | "NEXT_PUBLIC_ENABLE_CHECKR" | "NEXT_PUBLIC_ENABLE_LEGACY_CHECKOUT",
        string | undefined
    >
>;

function isTruthyFlag(value: string | undefined) {
    return /^(1|true|yes|on)$/i.test((value ?? "").trim());
}

export function isCardCheckoutEnabled(env?: LaunchEnv) {
    return isTruthyFlag(
        env?.NEXT_PUBLIC_ENABLE_CARD_CHECKOUT
        ?? process.env.NEXT_PUBLIC_ENABLE_CARD_CHECKOUT
    );
}

export function isLegacyCheckoutEnabled(env?: LaunchEnv) {
    return isTruthyFlag(
        env?.NEXT_PUBLIC_ENABLE_LEGACY_CHECKOUT
        ?? process.env.NEXT_PUBLIC_ENABLE_LEGACY_CHECKOUT
    ) && isCardCheckoutEnabled(env);
}

export function isCheckrEnabled(env?: LaunchEnv) {
    return isTruthyFlag(
        env?.NEXT_PUBLIC_ENABLE_CHECKR
        ?? process.env.NEXT_PUBLIC_ENABLE_CHECKR
    );
}

export function paymentModeLabel(env?: LaunchEnv) {
    if (isLegacyCheckoutEnabled(env)) return "Card or invoice";
    return "Off-platform";
}

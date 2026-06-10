export type LaunchEnv = Partial<
    Record<
        "NEXT_PUBLIC_ENABLE_CARD_CHECKOUT" | "NEXT_PUBLIC_ENABLE_CHECKR",
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

export function isCheckrEnabled(env?: LaunchEnv) {
    return isTruthyFlag(
        env?.NEXT_PUBLIC_ENABLE_CHECKR
        ?? process.env.NEXT_PUBLIC_ENABLE_CHECKR
    );
}

export function paymentModeLabel(env?: LaunchEnv) {
    return isCardCheckoutEnabled(env) ? "Card or invoice" : "Invoice / PO only";
}

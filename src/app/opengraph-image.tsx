import { ImageResponse } from "next/og";

// Route segment config — static so Next.js generates the image at build time.
export const runtime = "edge";

export const alt = "EduGig — The K-12 Educator Marketplace";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

// Brand palette — matches `--accent-secondary` (flat yellow/olive) and `--accent-primary` (chalkboard green).
const BRAND_BG = "#FACC15";
const BRAND_INK = "#1A1A18";
const BRAND_ACCENT = "#2D4A3E";

export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    background: BRAND_BG,
                    padding: "96px",
                    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        marginBottom: "48px",
                    }}
                >
                    <div
                        style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "8px",
                            background: BRAND_ACCENT,
                        }}
                    />
                    <span
                        style={{
                            fontSize: "32px",
                            fontWeight: 700,
                            color: BRAND_INK,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        EduGig
                    </span>
                </div>
                <div
                    style={{
                        display: "flex",
                        fontSize: "128px",
                        fontWeight: 800,
                        color: BRAND_INK,
                        letterSpacing: "-0.04em",
                        lineHeight: 1,
                    }}
                >
                    EduGig
                </div>
                <div
                    style={{
                        display: "flex",
                        fontSize: "56px",
                        fontWeight: 500,
                        color: BRAND_INK,
                        marginTop: "32px",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.15,
                        maxWidth: "900px",
                    }}
                >
                    The K-12 Educator Marketplace
                </div>
                <div
                    style={{
                        display: "flex",
                        fontSize: "28px",
                        fontWeight: 500,
                        color: BRAND_ACCENT,
                        marginTop: "40px",
                        letterSpacing: "-0.01em",
                    }}
                >
                    Credential-verified educators. Direct district connections.
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}

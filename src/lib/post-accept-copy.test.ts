import { describe, expect, it } from "vitest";
import {
    CONSULTANT_POST_ACCEPT_COPY,
    DISTRICT_POST_ACCEPT_COPY,
    getPostAcceptCopy,
} from "./post-accept-copy";

describe("getPostAcceptCopy", () => {
    it("tells the district to reach out within 3 business days", () => {
        expect(getPostAcceptCopy("district")).toBe(DISTRICT_POST_ACCEPT_COPY);
        expect(DISTRICT_POST_ACCEPT_COPY).toMatch(/3 business days/i);
        expect(DISTRICT_POST_ACCEPT_COPY).toMatch(/reach out to the consultant/i);
        expect(DISTRICT_POST_ACCEPT_COPY).not.toMatch(/Contract Hub/i);
    });

    it("tells the consultant to follow up if the school is silent", () => {
        expect(getPostAcceptCopy("educator")).toBe(CONSULTANT_POST_ACCEPT_COPY);
        expect(CONSULTANT_POST_ACCEPT_COPY).toMatch(/3 business days/i);
        expect(CONSULTANT_POST_ACCEPT_COPY).toMatch(/reach out/i);
        expect(CONSULTANT_POST_ACCEPT_COPY).not.toMatch(/Contract Hub/i);
    });
});

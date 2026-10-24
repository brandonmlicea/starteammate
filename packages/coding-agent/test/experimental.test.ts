import { afterEach, describe, expect, it } from "vitest";
import { areExperimentalFeaturesEnabled } from "../src/core/experimental.ts";

describe("areExperimentalFeaturesEnabled", () => {
	const originalStarteammateExperimental = process.env.STARTEAMMATE_EXPERIMENTAL;

	afterEach(() => {
		if (originalStarteammateExperimental === undefined) {
			delete process.env.STARTEAMMATE_EXPERIMENTAL;
		} else {
			process.env.STARTEAMMATE_EXPERIMENTAL = originalStarteammateExperimental;
		}
	});

	it("returns false when STARTEAMMATE_EXPERIMENTAL is unset", () => {
		delete process.env.STARTEAMMATE_EXPERIMENTAL;

		expect(areExperimentalFeaturesEnabled()).toBe(false);
	});

	it("returns false when STARTEAMMATE_EXPERIMENTAL is empty", () => {
		process.env.STARTEAMMATE_EXPERIMENTAL = "";

		expect(areExperimentalFeaturesEnabled()).toBe(false);
	});

	it("returns true when STARTEAMMATE_EXPERIMENTAL is set to 1", () => {
		process.env.STARTEAMMATE_EXPERIMENTAL = "1";

		expect(areExperimentalFeaturesEnabled()).toBe(true);
	});

	it("returns false when STARTEAMMATE_EXPERIMENTAL is set to 0", () => {
		process.env.STARTEAMMATE_EXPERIMENTAL = "0";

		expect(areExperimentalFeaturesEnabled()).toBe(false);
	});

	it("returns false when STARTEAMMATE_EXPERIMENTAL is set to a non-1 value", () => {
		process.env.STARTEAMMATE_EXPERIMENTAL = "true";

		expect(areExperimentalFeaturesEnabled()).toBe(false);
	});
});

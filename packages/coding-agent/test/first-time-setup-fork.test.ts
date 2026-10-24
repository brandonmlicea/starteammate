import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/config.ts", async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...(actual as Record<string, unknown>),
		PACKAGE_NAME: "@example/starteammate-coding-agent",
	};
});

import { shouldRunFirstTimeSetup } from "../src/cli/startup-ui.ts";

describe("shouldRunFirstTimeSetup in forked distributions", () => {
	const originalStarteammateExperimental = process.env.STARTEAMMATE_EXPERIMENTAL;
	let tempDir: string;
	let settingsPath: string;

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), "starteammate-first-time-setup-fork-"));
		settingsPath = join(tempDir, "settings.json");
		process.env.STARTEAMMATE_EXPERIMENTAL = "1";
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
		if (originalStarteammateExperimental === undefined) {
			delete process.env.STARTEAMMATE_EXPERIMENTAL;
		} else {
			process.env.STARTEAMMATE_EXPERIMENTAL = originalStarteammateExperimental;
		}
	});

	it("returns false for a forked package", () => {
		expect(shouldRunFirstTimeSetup(settingsPath)).toBe(false);
	});
});

import { type ClientIdentity, STARTEAMMATE_ATTRIBUTION } from "@starteammate/ai";
import { VERSION } from "../config.ts";
import type { SettingsManager } from "./settings-manager.ts";
import { isInstallTelemetryEnabled } from "./telemetry.ts";

/**
 * How starteammate's requests identify it to providers: a detailed `User-Agent` with starteammate's version, and attribution to starteammate as a
 * CLI agent while install telemetry is enabled.
 */
export function getClientIdentity(settingsManager: SettingsManager): ClientIdentity {
	return {
		userAgent: "detailed",
		version: VERSION,
		attribution: isInstallTelemetryEnabled(settingsManager) ? STARTEAMMATE_ATTRIBUTION : null,
	};
}

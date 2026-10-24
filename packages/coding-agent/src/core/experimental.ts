export function areExperimentalFeaturesEnabled(): boolean {
	return process.env.STARTEAMMATE_EXPERIMENTAL === "1";
}

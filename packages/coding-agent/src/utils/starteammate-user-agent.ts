import { formatUserAgent } from "@starteammate/ai";

/** starteammate's `User-Agent` for its own network requests; the same detailed form starteammate-ai sends to providers. */
export function getStarteammateUserAgent(version: string): string {
	return formatUserAgent({ userAgent: "detailed", version });
}

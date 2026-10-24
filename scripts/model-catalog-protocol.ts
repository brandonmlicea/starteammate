/**
 * Model catalog protocol shared by starteammate and pi.dev.
 *
 * This file is copied verbatim into two repositories. Change both copies in
 * the same pair of pull requests and keep them byte for byte identical:
 *
 *   earendil-works/starteammate      scripts/model-catalog-protocol.ts
 *   earendil-works/pi.dev  src/shared/models/protocol.ts
 *
 * starteammate uses it to publish catalog revisions and to test clients against the
 * catalog selection pi.dev performs. pi.dev uses it to serve catalog requests.
 * Keep it free of imports and runtime specific APIs so it runs unchanged in
 * Node.js and Cloudflare Workers.
 *
 * Storage layout under `MODEL_CATALOG_PREFIX`:
 *
 *   index.json                                    revision index (`ModelCatalogIndex`)
 *   revisions/<revision>/models.json              chat models by provider and id
 *   revisions/<revision>/models.all.json          models of every type by provider
 *   revisions/<revision>/providers.json           sorted provider ids
 *   revisions/<revision>/providers/<id>.json      chat models of one provider by id
 *   revisions/<revision>/providers/<id>.all.json  models of every type of one provider
 *
 * Clients that send `?types=` receive the typed `.all.json` variant. Older
 * clients receive the legacy chat-only variant.
 */

export const MODEL_CATALOG_SCHEMA_VERSION = 1;
export const MODEL_CATALOG_PREFIX = `models/v${MODEL_CATALOG_SCHEMA_VERSION}`;
export const MODEL_CATALOG_INDEX_KEY = `${MODEL_CATALOG_PREFIX}/index.json`;
export const MODEL_CATALOG_REVISION_RE = /^sha256-[0-9a-f]{64}$/;

const STARTEAMMATE_VERSION_RE = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
const STARTEAMMATE_USER_AGENT_RE = /^starteammate\/([^\s()]+)(?: \([^;()]+(?:;\s*[^;()]+(?:;\s*[^()]+)?)?\))?$/i;
const MODEL_TYPE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

type ParsedStarteammateVersion = readonly [major: number, minor: number, patch: number, prerelease: string];

export type ModelCatalogArtifact = "models.json" | "models.all.json" | "providers.json";

export type ModelCatalogRepresentation = "legacy" | "typed";

export type ModelCatalogIndexEntry = {
	minimumStarteammateVersion: string;
	revision: string;
};

export type ModelCatalogIndex = {
	schemaVersion: number;
	defaultRevision: string;
	catalogs: ModelCatalogIndexEntry[];
};

export type ModelCatalogRequest =
	| { kind: "catalog"; starteammateVersion: string | undefined; representation: ModelCatalogRepresentation }
	| { kind: "redirect"; location: string }
	| { kind: "invalid"; error: string };

export function getModelCatalogArtifactKey(revision: string, artifact: ModelCatalogArtifact): string {
	return `${MODEL_CATALOG_PREFIX}/revisions/${revision}/${artifact}`;
}

export function getModelCatalogProviderKey(
	revision: string,
	provider: string,
	representation: ModelCatalogRepresentation,
): string {
	const suffix = representation === "typed" ? ".all.json" : ".json";
	return `${MODEL_CATALOG_PREFIX}/revisions/${revision}/providers/${provider}${suffix}`;
}

export function isValidModelCatalogStarteammateVersion(version: string): boolean {
	return parseStarteammateVersion(version) !== undefined;
}

/** Compare two Starteammate versions with semver precedence. Throws for invalid versions. */
export function compareModelCatalogStarteammateVersions(left: string, right: string): number {
	return compareStarteammateVersions(requireStarteammateVersion(left), requireStarteammateVersion(right));
}

/**
 * Parse the `types` query parameter. Returns undefined when it is present but
 * invalid. Clients that do not send it predate model types.
 */
export function parseModelCatalogRepresentation(
	types: string | null | undefined,
): ModelCatalogRepresentation | undefined {
	if (types === undefined || types === null) {
		return "legacy";
	}
	if (types === "" || types.split(",").some((type) => !MODEL_TYPE_RE.test(type))) {
		return undefined;
	}
	return "typed";
}

/**
 * Decide how to answer a catalog request from its URL and User-Agent.
 *
 * Released clients do not send `starteammate-version`. Responses are cached by URL, so
 * instead of varying the response on the User-Agent, clients that identify
 * as Starteammate are redirected to the equivalent URL with an explicit `starteammate-version`.
 * Requests without a Starteammate User-Agent receive the default catalog.
 */
export function parseModelCatalogRequest(url: string | URL, userAgent: string | null | undefined): ModelCatalogRequest {
	const requestUrl = new URL(url);
	const representation = parseModelCatalogRepresentation(requestUrl.searchParams.get("types"));
	if (representation === undefined) {
		return { kind: "invalid", error: "Invalid model types." };
	}

	const starteammateVersion = requestUrl.searchParams.get("starteammate-version");
	if (starteammateVersion === null) {
		const userAgentVersion = STARTEAMMATE_USER_AGENT_RE.exec(userAgent ?? "")?.[1];
		if (userAgentVersion !== undefined && isValidModelCatalogStarteammateVersion(userAgentVersion)) {
			requestUrl.searchParams.set("starteammate-version", userAgentVersion);
			return { kind: "redirect", location: requestUrl.toString() };
		}
		return { kind: "catalog", starteammateVersion: undefined, representation };
	}
	if (!isValidModelCatalogStarteammateVersion(starteammateVersion)) {
		return { kind: "invalid", error: "Invalid Starteammate version." };
	}
	return { kind: "catalog", starteammateVersion, representation };
}

/**
 * Select the catalog revision for a Starteammate version: the entry with the highest
 * minimum version that does not exceed it. Requests without a version receive
 * the default revision. Returns undefined when no entry is compatible.
 */
export function selectModelCatalog(
	index: ModelCatalogIndex,
	starteammateVersion: string | undefined,
): ModelCatalogIndexEntry | undefined {
	if (starteammateVersion === undefined) {
		return index.catalogs.find((catalog) => catalog.revision === index.defaultRevision);
	}

	const requestedVersion = parseStarteammateVersion(starteammateVersion);
	if (!requestedVersion) {
		return undefined;
	}

	let selected: ModelCatalogIndexEntry | undefined;
	let selectedVersion: ParsedStarteammateVersion | undefined;
	for (const catalog of index.catalogs) {
		const minimumVersion = requireStarteammateVersion(catalog.minimumStarteammateVersion);
		if (
			compareStarteammateVersions(minimumVersion, requestedVersion) <= 0 &&
			(!selectedVersion || compareStarteammateVersions(minimumVersion, selectedVersion) > 0)
		) {
			selected = catalog;
			selectedVersion = minimumVersion;
		}
	}
	return selected;
}

/**
 * Validate an index read from storage. Returns only the protocol fields;
 * publishers may store additional metadata on each entry.
 */
export function parseModelCatalogIndex(value: unknown): ModelCatalogIndex {
	if (
		typeof value !== "object" ||
		value === null ||
		Array.isArray(value) ||
		!("schemaVersion" in value) ||
		value.schemaVersion !== MODEL_CATALOG_SCHEMA_VERSION ||
		!("defaultRevision" in value) ||
		typeof value.defaultRevision !== "string" ||
		!MODEL_CATALOG_REVISION_RE.test(value.defaultRevision) ||
		!("catalogs" in value) ||
		!Array.isArray(value.catalogs) ||
		value.catalogs.length === 0 ||
		value.catalogs.some(
			(catalog) =>
				typeof catalog !== "object" ||
				catalog === null ||
				typeof catalog.minimumStarteammateVersion !== "string" ||
				!parseStarteammateVersion(catalog.minimumStarteammateVersion) ||
				typeof catalog.revision !== "string" ||
				!MODEL_CATALOG_REVISION_RE.test(catalog.revision),
		) ||
		!value.catalogs.some((catalog) => catalog.revision === value.defaultRevision)
	) {
		throw new Error(`Model catalog index is invalid: ${MODEL_CATALOG_INDEX_KEY}`);
	}

	return {
		schemaVersion: value.schemaVersion,
		defaultRevision: value.defaultRevision,
		catalogs: value.catalogs.map(({ minimumStarteammateVersion, revision }) => ({
			minimumStarteammateVersion,
			revision,
		})),
	};
}

function requireStarteammateVersion(version: string): ParsedStarteammateVersion {
	const parsed = parseStarteammateVersion(version);
	if (!parsed) {
		throw new Error(`Invalid Starteammate version: ${version}`);
	}
	return parsed;
}

function parseStarteammateVersion(version: string): ParsedStarteammateVersion | undefined {
	const match = STARTEAMMATE_VERSION_RE.exec(version.trim());
	if (!match) {
		return undefined;
	}
	const parsed = [Number(match[1]), Number(match[2]), Number(match[3])] as const;
	if (parsed.some((part) => !Number.isSafeInteger(part))) {
		return undefined;
	}
	return [parsed[0], parsed[1], parsed[2], match[4] ?? ""];
}

function compareStarteammateVersions(left: ParsedStarteammateVersion, right: ParsedStarteammateVersion): number {
	for (const index of [0, 1, 2] as const) {
		const difference = left[index] - right[index];
		if (difference !== 0) {
			return difference;
		}
	}

	const leftPrerelease = left[3];
	const rightPrerelease = right[3];
	if (leftPrerelease === rightPrerelease) {
		return 0;
	}
	if (!leftPrerelease) {
		return 1;
	}
	if (!rightPrerelease) {
		return -1;
	}

	const leftParts = leftPrerelease.split(".");
	const rightParts = rightPrerelease.split(".");
	for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
		const leftPart = leftParts[index];
		const rightPart = rightParts[index];
		if (leftPart === undefined) return -1;
		if (rightPart === undefined) return 1;
		if (leftPart === rightPart) continue;

		const leftNumber = /^\d+$/.test(leftPart) ? Number(leftPart) : undefined;
		const rightNumber = /^\d+$/.test(rightPart) ? Number(rightPart) : undefined;
		if (leftNumber !== undefined && rightNumber !== undefined) {
			return leftNumber - rightNumber;
		}
		if (leftNumber !== undefined) return -1;
		if (rightNumber !== undefined) return 1;
		return leftPart.localeCompare(rightPart);
	}
	return 0;
}

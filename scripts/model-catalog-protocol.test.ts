import assert from "node:assert/strict";
import test from "node:test";
import {
	compareModelCatalogStarteammateVersions,
	getModelCatalogArtifactKey,
	getModelCatalogProviderKey,
	type ModelCatalogIndex,
	parseModelCatalogIndex,
	parseModelCatalogRepresentation,
	parseModelCatalogRequest,
	selectModelCatalog,
} from "./model-catalog-protocol.ts";

const legacyRevision = `sha256-${"a".repeat(64)}`;
const mixedApiRevision = `sha256-${"b".repeat(64)}`;
const index: ModelCatalogIndex = {
	schemaVersion: 1,
	defaultRevision: mixedApiRevision,
	catalogs: [
		{ minimumStarteammateVersion: "0.80.7", revision: legacyRevision },
		{ minimumStarteammateVersion: "0.85.0", revision: mixedApiRevision },
	],
};

test("builds revision scoped storage keys", () => {
	assert.equal(
		getModelCatalogArtifactKey(legacyRevision, "models.json"),
		`models/v1/revisions/${legacyRevision}/models.json`,
	);
	assert.equal(
		getModelCatalogProviderKey(legacyRevision, "openrouter", "legacy"),
		`models/v1/revisions/${legacyRevision}/providers/openrouter.json`,
	);
	assert.equal(
		getModelCatalogProviderKey(legacyRevision, "openrouter", "typed"),
		`models/v1/revisions/${legacyRevision}/providers/openrouter.all.json`,
	);
});

test("orders Starteammate versions with semver precedence", () => {
	assert.ok(compareModelCatalogStarteammateVersions("0.85.0", "0.84.4") > 0);
	assert.ok(compareModelCatalogStarteammateVersions("0.85.0-rc.1", "0.85.0") < 0);
	assert.ok(compareModelCatalogStarteammateVersions("0.85.0-rc.2", "0.85.0-rc.10") < 0);
	assert.equal(compareModelCatalogStarteammateVersions("v1.0.0", "1.0.0+build"), 0);
	assert.throws(() => compareModelCatalogStarteammateVersions("0.85", "0.85.0"), /Invalid Starteammate version/);
});

test("selects the newest catalog a Starteammate version supports", () => {
	// Regression test for #9099: released clients before 0.85.0 cannot use the mixed-API catalog.
	assert.equal(selectModelCatalog(index, "0.84.4")?.revision, legacyRevision);
	assert.equal(selectModelCatalog(index, "0.85.0-rc.1")?.revision, legacyRevision);
	assert.equal(selectModelCatalog(index, "0.85.0")?.revision, mixedApiRevision);
	assert.equal(selectModelCatalog(index, "1.0.0")?.revision, mixedApiRevision);
	assert.equal(selectModelCatalog(index, "0.80.6"), undefined);
	assert.equal(selectModelCatalog(index, undefined)?.revision, mixedApiRevision);
});

test("redirects Starteammate user agents to an explicit catalog version", () => {
	// Regression test for #9099: released clients identify themselves only by User-Agent.
	assert.deepEqual(
		parseModelCatalogRequest(
			"https://pi.dev/api/models/providers/openrouter?types=chat%2Cimage",
			"starteammate/0.84.4 (linux; node/v22.0.0; x64)",
		),
		{
			kind: "redirect",
			location: "https://pi.dev/api/models/providers/openrouter?types=chat%2Cimage&starteammate-version=0.84.4",
		},
	);
	assert.deepEqual(parseModelCatalogRequest("https://pi.dev/api/models", "starteammate/0.84.4"), {
		kind: "redirect",
		location: "https://pi.dev/api/models?starteammate-version=0.84.4",
	});
});

test("serves explicit and unversioned catalog requests without redirecting", () => {
	assert.deepEqual(
		parseModelCatalogRequest("https://pi.dev/api/models?starteammate-version=0.83.0", "starteammate/0.85.1 (linux; node/v22.0.0; x64)"),
		{ kind: "catalog", starteammateVersion: "0.83.0", representation: "legacy" },
	);
	assert.deepEqual(parseModelCatalogRequest("https://pi.dev/api/models?types=chat", "curl/8.0.0"), {
		kind: "catalog",
		starteammateVersion: undefined,
		representation: "typed",
	});
	assert.deepEqual(parseModelCatalogRequest("https://pi.dev/api/models", "starteammate/latest"), {
		kind: "catalog",
		starteammateVersion: undefined,
		representation: "legacy",
	});
});

test("rejects invalid catalog request parameters", () => {
	assert.deepEqual(parseModelCatalogRequest("https://pi.dev/api/models?starteammate-version=latest", undefined), {
		kind: "invalid",
		error: "Invalid Starteammate version.",
	});
	assert.deepEqual(parseModelCatalogRequest("https://pi.dev/api/models?types=", "starteammate/0.84.4"), {
		kind: "invalid",
		error: "Invalid model types.",
	});
	assert.equal(parseModelCatalogRepresentation("chat,-image"), undefined);
	assert.equal(parseModelCatalogRepresentation(null), "legacy");
});

test("validates stored indexes and drops publication metadata", () => {
	assert.deepEqual(
		parseModelCatalogIndex({
			...index,
			catalogs: index.catalogs.map((catalog) => ({ ...catalog, sourceCommit: "abc", modelCount: 1 })),
		}),
		index,
	);
	assert.throws(() => parseModelCatalogIndex({ ...index, schemaVersion: 2 }), /index is invalid/);
	assert.throws(() => parseModelCatalogIndex({ ...index, defaultRevision: `sha256-${"c".repeat(64)}` }), /invalid/);
	assert.throws(
		() => parseModelCatalogIndex({ ...index, catalogs: [{ minimumStarteammateVersion: "latest", revision: legacyRevision }] }),
		/invalid/,
	);
});

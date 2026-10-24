#!/usr/bin/env node

// Publishes the Starteammate packages to npm in dependency order, skipping any
// version that is already on the registry. Run it through its npm script so npm
// can be found on Windows, and sign in first (the account needs a granular
// access token with bypass 2FA to publish):
//
//   npm run publish:starteammate
//   npm run publish:starteammate -- --dry-run

import { existsSync } from "node:fs";
import { join } from "node:path";
import { execNpmSync } from "./npm-command.mjs";
import { getPublicWorkspacePackages } from "./release-packages.mjs";

const dryRun = process.argv.includes("--dry-run");
const unknown = process.argv.slice(2).filter((arg) => arg !== "--dry-run");
if (unknown.length > 0) throw new Error("Usage: node scripts/publish-starteammate.mjs [--dry-run]");

const ORDER = [
	"@starteammate/telemetry",
	"@starteammate/chord",
	"@starteammate/tui",
	"@starteammate/codemode",
	"@starteammate/mcp",
	"@starteammate/ai",
	"@starteammate/durable",
	"@starteammate/env",
	"@starteammate/agent-core",
	"starteammate",
];

const packages = getPublicWorkspacePackages(process.cwd());
const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
const missing = ORDER.filter((name) => !byName.has(name));
if (missing.length > 0) throw new Error(`Unknown packages in the publish order: ${missing.join(", ")}`);

function published(name, version) {
	try {
		const output = execNpmSync(["view", `${name}@${version}`, "version", "--json"], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		});
		return output.trim() !== "";
	} catch (error) {
		const text = ["stdout", "stderr"].map((key) => String(error?.[key] ?? "")).join("\n");
		if (text.includes("E404") || text.includes("404 Not Found")) return false;
		throw error;
	}
}

for (const name of ORDER) {
	const pkg = byName.get(name);
	if (!existsSync(join(pkg.directory, "dist"))) throw new Error(`${pkg.directory}/dist is missing: run npm run build first.`);
	if (published(name, pkg.version)) {
		console.log(`${name}@${pkg.version} is already published`);
		continue;
	}
	console.log(`${dryRun ? "Dry-running" : "Publishing"} ${name}@${pkg.version}`);
	const args = ["publish", "--ignore-scripts", "--access", "public", ...(dryRun ? ["--dry-run"] : [])];
	execNpmSync(args, { cwd: pkg.directory, stdio: "inherit" });
}

console.log(dryRun ? "Dry run finished." : "Published.");

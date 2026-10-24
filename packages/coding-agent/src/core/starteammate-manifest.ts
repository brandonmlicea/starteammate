import { readFileSync } from "node:fs";
import { stripBom } from "../utils/text.ts";

export interface StarteammateManifest {
	extensions?: string[];
	skills?: string[];
	prompts?: string[];
	themes?: string[];
}

const RESOURCE_FIELDS = ["extensions", "skills", "prompts", "themes"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readStarteammateManifest(packageJsonPath: string): StarteammateManifest | null {
	try {
		const pkg: unknown = JSON.parse(stripBom(readFileSync(packageJsonPath, "utf-8")));
		if (!isObject(pkg) || !isObject(pkg.starteammate)) {
			return null;
		}

		const manifest: StarteammateManifest = {};
		for (const field of RESOURCE_FIELDS) {
			const entries = pkg.starteammate[field];
			if (Array.isArray(entries) && entries.every((entry) => typeof entry === "string")) {
				manifest[field] = entries;
			}
		}
		return manifest;
	} catch {
		return null;
	}
}

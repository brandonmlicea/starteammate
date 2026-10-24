/**
 * Bash Spawn Hook Example
 *
 * Adjusts command, cwd, and env before execution.
 *
 * Usage:
 *   starteammate -e ./bash-spawn-hook.ts
 */

import type { ExtensionAPI } from "starteammate";
import { createBashTool } from "starteammate";

export default function (starteammate: ExtensionAPI) {
	const cwd = process.cwd();

	const bashTool = createBashTool(cwd, {
		spawnHook: ({ command, cwd, env }) => ({
			command: `source ~/.profile\n${command}`,
			cwd,
			env: { ...env, STARTEAMMATE_SPAWN_HOOK: "1" },
		}),
	});

	starteammate.registerTool({
		...bashTool,
		execute: async (id, params, signal, onUpdate, _ctx) => {
			return bashTool.execute(id, params, signal, onUpdate);
		},
	});
}

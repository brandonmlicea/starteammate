import * as bundledStarteammateAgentCore from "@starteammate/agent-core";
import * as bundledStarteammateAiCompat from "@starteammate/ai/compat";
import * as bundledStarteammateAiModels from "@starteammate/ai/models";
import * as bundledStarteammateAiOauth from "@starteammate/ai/oauth";
import * as bundledStarteammateAiProviders from "@starteammate/ai/providers/all";
import * as bundledStarteammateTui from "@starteammate/tui";
import * as bundledTypebox from "typebox";
import * as bundledTypeboxCompile from "typebox/compile";
import * as bundledTypeboxValue from "typebox/value";
// This import is safe because loader.ts exports are not re-exported from index.ts.
// Extensions can therefore import from starteammate.
import * as bundledStarteammateCodingAgent from "../../index.ts";

/** Modules available to extensions in source and compiled binary runtimes. */
export const VIRTUAL_MODULES: Record<string, unknown> = {
	typebox: bundledTypebox,
	"typebox/compile": bundledTypeboxCompile,
	"typebox/value": bundledTypeboxValue,
	"@sinclair/typebox": bundledTypebox,
	"@sinclair/typebox/compile": bundledTypeboxCompile,
	"@sinclair/typebox/value": bundledTypeboxValue,
	"@starteammate/agent-core": bundledStarteammateAgentCore,
	"@starteammate/tui": bundledStarteammateTui,
	// Extensions resolve the starteammate-ai root to the compat entrypoint (a strict
	// superset of the core entrypoint): existing extensions using the old
	// global API keep working at runtime until compat is removed.
	"@starteammate/ai": bundledStarteammateAiCompat,
	"@starteammate/ai/compat": bundledStarteammateAiCompat,
	"@starteammate/ai/models": bundledStarteammateAiModels,
	"@starteammate/ai/oauth": bundledStarteammateAiOauth,
	"@starteammate/ai/providers/all": bundledStarteammateAiProviders,
	starteammate: bundledStarteammateCodingAgent,
	"@mariozechner/starteammate-agent-core": bundledStarteammateAgentCore,
	"@mariozechner/starteammate-tui": bundledStarteammateTui,
	"@mariozechner/starteammate-ai": bundledStarteammateAiCompat,
	"@mariozechner/starteammate-ai/compat": bundledStarteammateAiCompat,
	"@mariozechner/starteammate-ai/models": bundledStarteammateAiModels,
	"@mariozechner/starteammate-ai/oauth": bundledStarteammateAiOauth,
	"@mariozechner/starteammate-ai/providers/all": bundledStarteammateAiProviders,
	"@mariozechner/starteammate-coding-agent": bundledStarteammateCodingAgent,
};

import type { ProviderStreams } from "../types.ts";
import { lazyApi } from "./lazy.ts";

export const starteammateMessagesApi = (): ProviderStreams => lazyApi(() => import("./starteammate-messages.ts"));

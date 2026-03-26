import { buildChannelConfigSchema, DiscordConfigSchema } from "openclaw/plugin-sdk/discord-core";
import { z } from "zod";

export const DiscordProgressModeSchema = z.enum(["off", "strict", "auto", "verbose"]);

export const DiscordConfigWithProgressSchema = DiscordConfigSchema.extend({
  progress: z
    .object({
      mode: DiscordProgressModeSchema.optional(),
    })
    .strict()
    .optional(),
});

export const DiscordChannelConfigSchema = buildChannelConfigSchema(DiscordConfigWithProgressSchema);

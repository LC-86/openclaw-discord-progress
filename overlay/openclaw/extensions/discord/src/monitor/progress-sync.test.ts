import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMocks = vi.hoisted(() => ({
  sendMessageDiscord: vi.fn(async () => ({ messageId: "progress-1", channelId: "c1" })),
  editMessageDiscord: vi.fn(async () => ({})),
}));

vi.mock("../send.js", () => ({
  sendMessageDiscord: sendMocks.sendMessageDiscord,
  editMessageDiscord: sendMocks.editMessageDiscord,
}));

const { createDiscordProgressSync } = await import("./progress-sync.js");

describe("createDiscordProgressSync", () => {
  beforeEach(() => {
    sendMocks.sendMessageDiscord.mockClear();
    sendMocks.editMessageDiscord.mockClear();
  });

  it("sends the first progress message and edits it as the task advances", async () => {
    const sync = createDiscordProgressSync({
      cfg: {},
      accountId: "default",
      rest: {} as never,
      channelId: "123",
      title: "检查 Discord 任务同步",
      debounceMs: 0,
      env: { ...process.env, OPENCLAW_DISCORD_PROGRESS_SYNC: "1" },
    });

    await sync.onAgentRunStart("run-1");
    await sync.onToolStart({ name: "web_search", phase: "start" });
    await sync.onFinalReply({ text: "已经得到最终结论" });
    await sync.finish();

    expect(sendMocks.sendMessageDiscord).toHaveBeenCalledTimes(1);
    const sendWithEmbedCall = sendMocks.sendMessageDiscord.mock.calls.find((call) => {
      const tuple = call as unknown[];
      const options = tuple[2] as { embeds?: unknown[] } | undefined;
      return Array.isArray(options?.embeds);
    });
    const sendWithEmbed = (sendWithEmbedCall as unknown[] | undefined)?.[2] as
      | { embeds?: unknown[] }
      | undefined;
    expect(sendWithEmbed?.embeds).toBeDefined();
    expect(sendMocks.editMessageDiscord).toHaveBeenCalled();
    const finalCall = sendMocks.editMessageDiscord.mock.calls.at(-1) as
      | [string, string, { content: string; embeds?: unknown[] }]
      | undefined;
    expect(finalCall?.[0]).toBe("123");
    expect(finalCall?.[1]).toBe("progress-1");
    expect(finalCall?.[2]).toMatchObject({
      content: expect.stringContaining("100%"),
      embeds: expect.any(Array),
    });
  });

  it("only emits a standalone timeline message when the task fails", async () => {
    const sync = createDiscordProgressSync({
      cfg: {},
      accountId: "default",
      rest: {} as never,
      channelId: "123",
      title: "失败任务",
      debounceMs: 0,
      env: { ...process.env, OPENCLAW_DISCORD_PROGRESS_SYNC: "1" },
    });

    await sync.onAgentRunStart("run-fail-1");
    await sync.finish({ error: new Error("网络超时") });

    expect(sendMocks.sendMessageDiscord).toHaveBeenCalledTimes(2);
    const timelineCall = sendMocks.sendMessageDiscord.mock.calls.at(-1) as
      | [string, string]
      | undefined;
    expect(timelineCall?.[1]).toContain("任务失败");
    expect(timelineCall?.[1]).toContain("网络超时");
  });

  it("can be disabled by environment variable", async () => {
    const sync = createDiscordProgressSync({
      cfg: {},
      accountId: "default",
      rest: {} as never,
      channelId: "123",
      title: "不会发送",
      debounceMs: 0,
      env: { ...process.env, OPENCLAW_DISCORD_PROGRESS_SYNC: "0" },
    });

    await sync.onAgentRunStart("run-2");
    await sync.finish();

    expect(sendMocks.sendMessageDiscord).not.toHaveBeenCalled();
    expect(sendMocks.editMessageDiscord).not.toHaveBeenCalled();
  });
});

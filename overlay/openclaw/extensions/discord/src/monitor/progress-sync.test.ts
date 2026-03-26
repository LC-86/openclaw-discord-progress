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

  it("does not create a progress card for casual chat in strict mode", async () => {
    const sync = createDiscordProgressSync({
      cfg: {},
      accountId: "default",
      rest: {} as never,
      channelId: "123",
      title: "算了，先不折腾了，你太蠢了，这点事情都搞不定",
      debounceMs: 0,
      env: { ...process.env, OPENCLAW_DISCORD_PROGRESS_SYNC: "1" },
    });

    await sync.onAgentRunStart("run-chat-1");
    await sync.onAssistantMessageStart();
    await sync.onFinalReply({ text: "说一句实话：这事跟模型本身没关系。" });
    await sync.finish();

    expect(sendMocks.sendMessageDiscord).not.toHaveBeenCalled();
    expect(sendMocks.editMessageDiscord).not.toHaveBeenCalled();
  });

  it("activates progress when a casual title still enters tool execution", async () => {
    const sync = createDiscordProgressSync({
      cfg: {},
      accountId: "default",
      rest: {} as never,
      channelId: "123",
      title: "你先看着办吧，我有点烦",
      debounceMs: 0,
      env: { ...process.env, OPENCLAW_DISCORD_PROGRESS_SYNC: "1" },
    });

    await sync.onAgentRunStart("run-tool-1");
    await sync.onToolStart({ name: "web_fetch", phase: "start" });
    await sync.onFinalReply({ text: "已经执行工具并拿到结果。" });
    await sync.finish();

    expect(sendMocks.sendMessageDiscord).toHaveBeenCalledTimes(1);
    expect(sendMocks.editMessageDiscord).toHaveBeenCalled();
  });

  it("uses smoother progress steps instead of jumping straight to 90%", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T00:00:00.000Z"));

    const sync = createDiscordProgressSync({
      cfg: {},
      accountId: "default",
      rest: {} as never,
      channelId: "123",
      title: "请检查今天上海天气并给我总结",
      debounceMs: 0,
      env: { ...process.env, OPENCLAW_DISCORD_PROGRESS_SYNC: "1" },
    });

    await sync.onAgentRunStart("run-smooth-1");
    vi.setSystemTime(new Date("2026-03-26T00:00:12.000Z"));
    await sync.onReasoningStream();
    vi.setSystemTime(new Date("2026-03-26T00:00:24.000Z"));
    await sync.onToolStart({ name: "web_search", phase: "start" });
    vi.setSystemTime(new Date("2026-03-26T00:00:48.000Z"));
    await sync.onAssistantMessageStart();
    vi.setSystemTime(new Date("2026-03-26T00:00:56.000Z"));
    await sync.onFinalReply({ text: "上海今天小雨，12 到 18 度。" });
    await sync.finish();

    const progressUpdates = sendMocks.editMessageDiscord.mock.calls
      .map((call) => {
        const tuple = call as unknown[];
        return (tuple[2] as { content?: string } | undefined)?.content ?? "";
      })
      .filter(Boolean);
    const percents = progressUpdates
      .map((content) => {
        const match = content.match(/(\d+)%/);
        return match ? Number(match[1]) : null;
      })
      .filter((value): value is number => value !== null);

    expect(percents.some((value) => value >= 20 && value <= 40)).toBe(true);
    expect(percents.some((value) => value >= 80 && value < 90)).toBe(true);
    expect(percents.includes(90)).toBe(false);
    expect(percents.at(-1)).toBe(100);

    vi.useRealTimers();
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
    const timelineCall = sendMocks.sendMessageDiscord.mock.calls.find((call) => {
      const tuple = call as unknown[];
      return typeof tuple[1] === "string" && tuple[1].includes("网络超时");
    }) as [string, string] | undefined;
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

  it("prefers config mode over environment mode when resolving progress display", async () => {
    const sync = createDiscordProgressSync({
      cfg: {
        channels: {
          discord: {
            progress: {
              mode: "off",
            },
          },
        },
      } as never,
      accountId: "default",
      rest: {} as never,
      channelId: "123",
      title: "请检查上海天气",
      debounceMs: 0,
      env: { ...process.env, OPENCLAW_DISCORD_PROGRESS_SYNC: "1", OPENCLAW_DISCORD_PROGRESS_MODE: "verbose" },
    });

    await sync.onAgentRunStart("run-config-1");
    await sync.onToolStart({ name: "web_search", phase: "start" });
    await sync.finish();

    expect(sendMocks.sendMessageDiscord).not.toHaveBeenCalled();
    expect(sendMocks.editMessageDiscord).not.toHaveBeenCalled();
  });
});

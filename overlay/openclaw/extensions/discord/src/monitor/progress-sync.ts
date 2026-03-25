import { Embed } from "@buape/carbon";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-runtime";
import type { ReplyPayload } from "openclaw/plugin-sdk/reply-runtime";
import { editMessageDiscord, sendMessageDiscord } from "../send.js";

type ProgressStage =
  | "waiting"
  | "running"
  | "reasoning"
  | "tool"
  | "compacting"
  | "finalizing"
  | "completed"
  | "failed";

type ProgressState = {
  runId?: string;
  title: string;
  stage: ProgressStage;
  message: string;
  percent: number;
  toolCount: number;
  startedAt?: number;
  summary?: string;
  error?: string;
  sawReasoning: boolean;
  sawCompaction: boolean;
  sawAssistant: boolean;
  lastToolName?: string;
};

export type DiscordProgressSync = {
  onAgentRunStart: (runId: string) => Promise<void>;
  onReasoningStream: () => Promise<void>;
  onToolStart: (payload: { name?: string; phase?: string }) => Promise<void>;
  onAssistantMessageStart: () => Promise<void>;
  onCompactionStart: () => Promise<void>;
  onCompactionEnd: () => Promise<void>;
  onFinalReply: (payload: ReplyPayload) => Promise<void>;
  finish: (params?: { error?: unknown; aborted?: boolean }) => Promise<void>;
};

function isProgressSyncEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.OPENCLAW_DISCORD_PROGRESS_SYNC?.trim().toLowerCase();
  return raw !== "0" && raw !== "false" && raw !== "off";
}

function summarizeText(value: string | undefined, maxLength = 180): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return undefined;
  }
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function renderBar(percent: number): string {
  const width = 12;
  const safe = clampPercent(percent);
  const filled = Math.round((safe / 100) * width);
  return `${"█".repeat(filled)}${"░".repeat(width - filled)} ${safe}%`;
}

function formatDuration(startedAt?: number): string {
  if (!startedAt) {
    return "0秒";
  }
  const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  if (seconds < 60) {
    return `${seconds}秒`;
  }
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${minutes}分${remain}秒`;
}

function stageLabel(stage: ProgressStage): string {
  switch (stage) {
    case "reasoning":
      return "分析中";
    case "tool":
      return "工具执行中";
    case "compacting":
      return "压缩上下文";
    case "finalizing":
      return "整理结果";
    case "completed":
      return "任务完成";
    case "failed":
      return "任务失败";
    case "running":
      return "任务启动";
    default:
      return "准备中";
  }
}

function statusIcon(stage: ProgressStage): string {
  switch (stage) {
    case "completed":
      return "✅";
    case "failed":
      return "🔴";
    case "tool":
      return "🛠️";
    case "reasoning":
      return "🧠";
    case "compacting":
      return "🗜️";
    case "finalizing":
      return "📦";
    case "running":
      return "🚀";
    default:
      return "⏳";
  }
}

function statusColor(stage: ProgressStage): number {
  switch (stage) {
    case "completed":
      return 0x2ecc71;
    case "failed":
      return 0xe74c3c;
    case "compacting":
      return 0xf1c40f;
    case "tool":
      return 0x3498db;
    case "reasoning":
      return 0x5dade2;
    case "finalizing":
      return 0x16a085;
    default:
      return 0x5865f2;
  }
}

function buildFeatureLines(state: ProgressState): string[] {
  return [
    `${state.toolCount > 0 ? "✅" : "▫️"} 工具调用：${state.toolCount > 0 ? `${state.toolCount} 次` : "未发生"}`,
    `${state.sawReasoning ? "✅" : "▫️"} 多步推理：${state.sawReasoning ? "已检测" : "未检测"}`,
    `${state.sawCompaction ? "✅" : "▫️"} 上下文压缩：${state.sawCompaction ? "发生过" : "未发生"}`,
    `${state.sawAssistant ? "✅" : "▫️"} 结果整理：${state.sawAssistant ? "已进入输出阶段" : "尚未进入"}`,
  ];
}

function buildHealthScore(state: ProgressState): number {
  if (state.stage === "failed") {
    return 24;
  }
  let score = 72;
  if (state.sawReasoning) {
    score += 8;
  }
  if (state.toolCount > 0) {
    score += 10;
  }
  if (state.sawAssistant) {
    score += 6;
  }
  if (state.sawCompaction) {
    score -= 4;
  }
  if (state.stage === "completed") {
    score += 8;
  }
  return Math.max(0, Math.min(100, score));
}

function buildProgressEmbed(state: ProgressState): Embed {
  const fields = [
    { name: "状态", value: stageLabel(state.stage), inline: true },
    { name: "进度", value: renderBar(state.percent), inline: true },
    { name: "健康度", value: `${buildHealthScore(state)}/100`, inline: true },
    {
      name: "运行指标",
      value: [
        `耗时：${formatDuration(state.startedAt)}`,
        `工具：${state.toolCount} 次`,
        `最近工具：${state.lastToolName ?? "无"}`,
      ].join("\n"),
      inline: true,
    },
    {
      name: "任务特征",
      value: buildFeatureLines(state).join("\n"),
      inline: true,
    },
    {
      name: "运行 ID",
      value: state.runId ?? "-",
      inline: true,
    },
  ];
  if (state.summary) {
    fields.push({
      name: "最终摘要",
      value: state.summary,
      inline: false,
    });
  }

  if (state.error) {
    fields.push({
      name: "错误信息",
      value: state.error,
      inline: false,
    });
  }

  return new Embed({
    title: `${statusIcon(state.stage)} ${state.title}`,
    description: `**当前动作**\n${state.message}`,
    color: statusColor(state.stage),
    fields,
    footer: {
      text:
        state.stage === "completed"
          ? "任务完成，主卡已冻结为最终报告"
          : state.stage === "failed"
            ? "任务失败，请查看错误信息"
            : "OpenClaw Discord 实时任务面板",
    },
  });
}

function renderCardFallbackText(state: ProgressState): string {
  return `${statusIcon(state.stage)} ${stageLabel(state.stage)} | ${clampPercent(state.percent)}%`;
}

function renderTimelineText(state: ProgressState): string {
  const lines = [
    `${statusIcon(state.stage)} ${stageLabel(state.stage)}`,
    `当前动作：${state.message}`,
    `进度：${renderBar(state.percent)}`,
    `耗时：${formatDuration(state.startedAt)}`,
  ];
  if (state.error) {
    lines.push(`错误：${state.error}`);
  }
  return lines.join("\n");
}

function shouldEmitTimelineEvent(previous: ProgressStage | undefined, next: ProgressStage): boolean {
  void previous;
  return next === "failed";
}

export function createDiscordProgressSync(params: {
  cfg: OpenClawConfig;
  accountId?: string;
  rest: unknown;
  channelId: string;
  title: string;
  debounceMs?: number;
  env?: NodeJS.ProcessEnv;
}): DiscordProgressSync {
  const enabled = isProgressSyncEnabled(params.env);
  const debounceMs = Math.max(0, Math.round(params.debounceMs ?? 1200));
  const state: ProgressState = {
    title: summarizeText(params.title, 120) ?? "未命名任务",
    stage: "waiting",
    message: "等待 Agent 启动",
    percent: 0,
    toolCount: 0,
    sawReasoning: false,
    sawCompaction: false,
    sawAssistant: false,
  };
  let messageId: string | undefined;
  let timer: NodeJS.Timeout | undefined;
  let disposed = false;
  let queue: Promise<void> = Promise.resolve();
  let timelineCount = 0;
  let previousStage: ProgressStage | undefined;

  const runQueued = (task: () => Promise<void>) => {
    queue = queue.catch(() => undefined).then(task);
    return queue;
  };

  const flushNow = async () => {
    if (!enabled || disposed) {
      return;
    }
    const content = renderCardFallbackText(state);
    const embeds = [buildProgressEmbed(state)];
    if (!messageId) {
      const result = await sendMessageDiscord(`channel:${params.channelId}`, content, {
        cfg: params.cfg,
        accountId: params.accountId,
        rest: params.rest as never,
        embeds,
      });
      messageId = result.messageId;
      return;
    }
    await editMessageDiscord(
      params.channelId,
      messageId,
      { content, embeds },
      {
        rest: params.rest as never,
      },
    );
  };

  const emitTimelineEvent = async () => {
    if (!enabled || disposed || timelineCount >= 1) {
      return;
    }
    timelineCount += 1;
    await sendMessageDiscord(`channel:${params.channelId}`, renderTimelineText(state), {
      cfg: params.cfg,
      accountId: params.accountId,
      rest: params.rest as never,
    });
  };

  const scheduleFlush = async (force = false) => {
    if (!enabled || disposed) {
      return;
    }
    if (force || debounceMs === 0) {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      await runQueued(flushNow);
      return;
    }
    if (timer) {
      return;
    }
    await runQueued(
      async () =>
        await new Promise<void>((resolve) => {
          timer = setTimeout(() => {
            timer = undefined;
            void flushNow().finally(resolve);
          }, debounceMs);
        }),
    );
  };

  const updateState = async (
    patch: Partial<ProgressState>,
    options: {
      force?: boolean;
    } = {},
  ) => {
    if (!enabled || disposed) {
      return;
    }
    const nextStage = patch.stage ?? state.stage;
    const shouldEmitTimeline = shouldEmitTimelineEvent(previousStage, nextStage);
    Object.assign(state, patch);
    state.percent = clampPercent(state.percent);
    previousStage = state.stage;
    if (shouldEmitTimeline) {
      await runQueued(emitTimelineEvent);
    }
    await scheduleFlush(options.force === true);
  };

  return {
    onAgentRunStart: async (runId) => {
      state.startedAt = Date.now();
      await updateState(
        {
          runId,
          stage: "running",
          percent: 8,
          message: "Agent 已开始执行任务",
        },
        { force: true },
      );
    },
    onReasoningStream: async () => {
      await updateState({
        stage: "reasoning",
        percent: Math.max(state.percent, 24),
        message: "正在分析问题和整理执行路径",
        sawReasoning: true,
      });
    },
    onToolStart: async (payload) => {
      state.toolCount += 1;
      const toolName = summarizeText(payload.name, 48) ?? "unknown";
      await updateState({
        stage: "tool",
        percent: Math.max(state.percent, Math.min(84, 28 + state.toolCount * 14)),
        lastToolName: toolName,
        message:
          payload.phase === "update"
            ? `工具 ${toolName} 正在返回结果`
            : `正在调用工具 ${toolName}`,
      });
    },
    onAssistantMessageStart: async () => {
      await updateState({
        stage: "finalizing",
        percent: Math.max(state.percent, 90),
        message: "正在整理最终回复",
        sawAssistant: true,
      });
    },
    onCompactionStart: async () => {
      await updateState({
        stage: "compacting",
        percent: Math.max(state.percent, 60),
        message: "上下文较长，正在压缩历史消息",
        sawCompaction: true,
      });
    },
    onCompactionEnd: async () => {
      await updateState({
        stage: "reasoning",
        percent: Math.max(state.percent, 72),
        message: "上下文压缩完成，继续执行",
      });
    },
    onFinalReply: async (payload) => {
      const summary = summarizeText(payload.text, 220);
      await updateState({
        summary,
        stage: "finalizing",
        percent: Math.max(state.percent, 96),
        message: "最终结果已经生成，正在发送到 Discord",
      });
    },
    finish: async (params = {}) => {
      if (!enabled || disposed) {
        return;
      }
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      const errorText =
        summarizeText(
          params.error instanceof Error ? params.error.message : String(params.error || ""),
        ) ?? undefined;
      Object.assign(state, {
        stage: params.error || params.aborted ? "failed" : "completed",
        percent: params.error || params.aborted ? Math.max(state.percent, 96) : 100,
        message: params.aborted
          ? "任务已中止"
          : params.error
            ? "任务执行失败，请检查错误信息"
            : "任务已完成，结果已同步到 Discord",
        error:
          params.error || params.aborted
            ? errorText ?? (params.aborted ? "任务被中止" : "未知错误")
            : undefined,
      });
      if (state.stage === "failed") {
        await runQueued(emitTimelineEvent);
      }
      await runQueued(flushNow);
      disposed = true;
    },
  };
}

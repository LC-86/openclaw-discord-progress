import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OpenClawConfig } from "../../config/config.js";

const readConfigFileSnapshotMock = vi.hoisted(() => vi.fn());
const validateConfigObjectWithPluginsMock = vi.hoisted(() => vi.fn());
const writeConfigFileMock = vi.hoisted(() => vi.fn());

vi.mock("../../config/config.js", async () => {
  const actual =
    await vi.importActual<typeof import("../../config/config.js")>("../../config/config.js");
  return {
    ...actual,
    readConfigFileSnapshot: readConfigFileSnapshotMock,
    validateConfigObjectWithPlugins: validateConfigObjectWithPluginsMock,
    writeConfigFile: writeConfigFileMock,
  };
});

const { buildCommandTestParams } = await import("./commands.test-harness.js");
const { handleProgressCommand } = await import("./commands-session.js");

function buildParams(commandBody: string, cfg: OpenClawConfig) {
  return buildCommandTestParams(commandBody, cfg, undefined, { workspaceDir: os.tmpdir() });
}

async function withTempConfigPath<T>(
  initialConfig: Record<string, unknown>,
  run: (configPath: string) => Promise<T>,
): Promise<T> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-progress-mode-"));
  const configPath = path.join(dir, "openclaw.json");
  const previous = process.env.OPENCLAW_CONFIG_PATH;
  process.env.OPENCLAW_CONFIG_PATH = configPath;
  await fs.writeFile(configPath, JSON.stringify(initialConfig, null, 2), "utf-8");
  try {
    return await run(configPath);
  } finally {
    if (previous === undefined) {
      delete process.env.OPENCLAW_CONFIG_PATH;
    } else {
      process.env.OPENCLAW_CONFIG_PATH = previous;
    }
    await fs.rm(dir, { recursive: true, force: true });
  }
}

afterEach(() => {
  readConfigFileSnapshotMock.mockReset();
  validateConfigObjectWithPluginsMock.mockReset();
  writeConfigFileMock.mockReset();
});

describe("handleProgressCommand", () => {
  it("shows the current mode when no argument is provided", async () => {
    const params = buildParams("/progress", {
      channels: { discord: { progress: { mode: "auto" } } },
    } as OpenClawConfig);

    const result = await handleProgressCommand(params, true);

    expect(result?.shouldContinue).toBe(false);
    expect(result?.reply?.text).toContain("当前 Discord 任务进度模式：auto");
  });

  it("persists the selected mode into config", async () => {
    await withTempConfigPath({ channels: { discord: {} } }, async (configPath) => {
      readConfigFileSnapshotMock.mockImplementation(async () => ({
        valid: true,
        parsed: JSON.parse(await fs.readFile(configPath, "utf-8")),
      }));
      validateConfigObjectWithPluginsMock.mockImplementation((config: unknown) => ({
        ok: true,
        config,
      }));
      writeConfigFileMock.mockImplementation(async (config: unknown) => {
        await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
      });

      const params = buildParams("/progress verbose", {
        channels: { discord: {} },
      } as OpenClawConfig);
      const result = await handleProgressCommand(params, true);
      const persisted = JSON.parse(await fs.readFile(configPath, "utf-8")) as Record<string, unknown>;

      expect(result?.reply?.text).toContain("Discord progress 模式已切换为 verbose");
      expect(persisted).toMatchObject({
        channels: {
          discord: {
            progress: {
              mode: "verbose",
            },
          },
        },
      });
    });
  });

  it("rejects invalid mode values", async () => {
    const params = buildParams("/progress noisy", {
      channels: { discord: {} },
    } as OpenClawConfig);

    const result = await handleProgressCommand(params, true);

    expect(result?.shouldContinue).toBe(false);
    expect(result?.reply?.text).toContain("无效模式");
  });
});

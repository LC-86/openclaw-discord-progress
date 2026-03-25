# OpenClaw Discord Progress

[English](README.md) | [简体中文](README.zh-CN.md)

![OpenClaw Discord Progress 实际效果截图](assets/screenshots/discord-progress-live.png)

`OpenClaw Discord Progress` 用来给 OpenClaw 的 Discord Agent 工作流增加“低噪声、实时更新”的任务进度卡片。

它主要解决这些问题：

- 长任务执行时，频道里看不到任务状态
- 任务过程容易刷出很多零碎文本，噪声偏大
- 多 Bot 模式下，如果配置不当，容易重复出卡
- 任务完成后，缺少一张清晰的最终结果卡片

## 这个项目包含什么

这个仓库故意拆成两层：

- GitHub 仓库：放公开可审查的发布材料、导出脚本、文件清单和说明文档
- ClawHub skill：作为安装入口和使用指引

这样做的好处是：

- GitHub 负责承载真正的公开发布内容
- ClawHub 负责让用户更容易发现和安装
- 不需要把你的私人配置文件一起公开

## 核心能力

### 主卡片

- 每个任务只生成 1 张主卡
- 任务执行过程中持续更新这张卡
- 任务完成后把主卡冻结成最终报告卡

### 降噪

- 成功任务默认只保留主卡和最终正文
- 尽量减少“工具执行中 / 整理结果”这类中间状态刷屏
- 失败时才额外保留必要的提示信息

### 多 Bot 安全

- 说明如何避免重复出卡
- 说明为什么正式环境里通常应该禁用 `accounts.default`
- 说明为什么一个 Discord Bot token（密钥，意思是：机器人登录凭证）只能给一个 account 用

## 仓库里的关键文件

- `overlay/openclaw/`
  导出的 OpenClaw 功能代码覆盖层（意思是：这次功能相关的源文件快照）
- `manifests/openclaw-release-files.txt`
  这次发布涉及的 OpenClaw 文件清单
- `scripts/export-openclaw-overlay.sh`
  用来从 OpenClaw checkout（源码工作目录，意思是：你本地的 OpenClaw 代码仓库）导出发布文件
- `skill/openclaw-discord-progress-installer/`
  用于 ClawHub 发布的安装型 skill

## 安装方式

有两种推荐路径。

### 快捷安装

如果你当前就在 OpenClaw 仓库根目录，可以直接执行：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/LC-86/openclaw-discord-progress/main/install.sh)
```

如果你想指定 OpenClaw 安装目录：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/LC-86/openclaw-discord-progress/main/install.sh) -- --target /path/to/openclaw
```

如果你只想先覆盖文件，不想立即构建或重启：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/LC-86/openclaw-discord-progress/main/install.sh) -- --no-build --no-restart
```

### 方式 A：通过 ClawHub skill 安装

适合不想自己读太多代码、希望按步骤启用的人。

1. 在 ClawHub 安装 skill：

```text
skill/openclaw-discord-progress-installer/
```

2. 阅读 skill 中的安装说明：

- `references/install.md`
- `references/multi-bot.md`

3. 按说明把 GitHub 仓库里的运行时代码应用到你的 OpenClaw 代码仓库
4. 重新构建 OpenClaw：

```bash
pnpm build
```

5. 重启 OpenClaw gateway（网关，意思是：负责消息收发的后台服务）：

```bash
openclaw gateway restart --json
```

6. 到 Discord 里发一条真实测试消息，确认：

- 只生成 1 张卡
- 卡片会原地更新
- 任务完成后卡片会冻结成最终报告

### 方式 B：直接从 GitHub 安装

适合已经熟悉 OpenClaw 代码仓库的人。

1. 克隆这个 GitHub 仓库
2. 查看或复制：

```text
overlay/openclaw/
```

3. 把里面的文件覆盖到你自己的 OpenClaw 仓库对应路径
4. 在 OpenClaw 仓库中执行：

```bash
pnpm build
openclaw gateway restart --json
```

5. 做一轮真实 Discord 验证

## 更新方式

如果后面这个功能有新版本：

1. 拉取这个仓库最新代码
2. 重新应用 `overlay/openclaw/` 里的改动
3. 重新构建 OpenClaw
4. 重启 gateway
5. 重新做一次真实 Discord 验证

## 不要公开的内容

这个仓库不应该包含：

- 你自己的 `openclaw.json`
- 你自己的 `.env`
- Discord bot token
- gateway token
- 私有频道 ID、用户 ID、会话记录

## 多 Bot 模式建议

如果你以后用多 Agent、多 Bot：

- 一个 Discord token 只给一个 account 用
- 正式环境建议禁用 `accounts.default`
- 不要让两个 account 共享同一个 Bot
- 尽量让每个 Bot 只负责自己的频道范围

## 这个仓库的定位

这个仓库是公开发布层，不是 OpenClaw 主仓库本体。

也就是说：

- 真正的运行时代码还是落在 OpenClaw 中
- 这个仓库负责“发布、导出、说明和安装入口”

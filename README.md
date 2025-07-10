# 禁言投票机器人

这是一个基于 Node.js 和 discord.js 的 Discord 机器人，允许服务器成员通过投票来临时禁言某个用户。

## 功能

-   使用 `/禁言搬屎用户` 斜杠指令发起投票。
-   通过对机器人发布的消息添加反应 (Reaction) 来进行投票。
-   当反应数量达到预设阈值时，自动禁言目标用户。
-   所有关键参数（如反应阈值、禁言时长等）均可通过 `config.json` 文件进行配置。

## 安装与配置

### 1. 克隆或下载项目

将项目文件下载到您的本地计算机。

### 2. 安装依赖

在项目根目录下打开终端，运行以下命令来安装所需的 Node.js 模块：

```bash
npm install
```

### 3. 首次运行与配置

**第一次运行机器人或部署指令时，`config.json` 和 `.env` 文件会自动生成。**

1.  在项目根目录下打开终端，运行 `npm start` 或 `npm run deploy`。
2.  程序会检测到文件不存在，自动创建它们，然后可能会因为缺少关键信息而退出。这是正常现象。
3.  打开新生成的 `.env` 文件，填入以下信息：
    ```
    DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
    CLIENT_ID=YOUR_CLIENT_ID_HERE
    GUILD_ID=YOUR_GUILD_ID_HERE
    ```
    -   `DISCORD_TOKEN`: 您机器人的令牌。
    -   `CLIENT_ID`: 您机器人的客户端ID。
    -   `GUILD_ID`: 您希望部署指令的服务器（公会）ID。
    
    您可以在 Discord 开发者门户网站的机器人页面找到这些信息。 **填写完毕后才能继续下一步。**

4.  （可选）打开新生成的 `config.json` 文件，您可以根据需要修改其中的参数：

-   `reactionThreshold`: 触发禁言所需的反应数量。
-   `muteDurationMinutes`: 禁言时长（分钟）。
-   `reactionEmoji`: 用于投票的表情符号。
-   `commandName`: 斜杠指令的名称。
-   `commandDescription`: 斜杠指令的描述。

## 运行机器人

### 1. 部署斜杠指令

在第一次运行或修改了指令后，您需要运行以下命令来向 Discord 注册或更新指令：

```bash
npm run deploy
```

### 2. 启动机器人

使用以下命令来启动机器人：

```bash
npm start
```

如果一切顺利，您应该会在终端看到 "机器人已上线!" 的消息。
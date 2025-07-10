const fs = require('fs');

// --- 配置文件和 .env 文件自动生成 ---
const configPath = './config.json';
const envPath = './.env';

if (!fs.existsSync(configPath)) {
  const defaultConfig = {
    "reactionThreshold": 10,
    "muteDurationMinutes": 5,
    "reactionEmoji": "🚫",
    "commandName": "禁言搬屎用户",
    "commandDescription": "发起一个投票来禁言一个用户"
  };
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  console.log('检测到 config.json 不存在，已自动生成。');
}

if (!fs.existsSync(envPath)) {
  const defaultEnv = 'DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE\nCLIENT_ID=YOUR_CLIENT_ID_HERE\nGUILD_ID=YOUR_GUILD_ID_HERE';
  fs.writeFileSync(envPath, defaultEnv);
  console.log('检测到 .env 不存在，已自动生成。请务必填写您的机器人信息！');
  process.exit(1); // 退出程序，强制用户填写 .env
}

require('dotenv').config();

// 检查 .env 文件是否已填写
if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'YOUR_BOT_TOKEN_HERE' ||
    !process.env.CLIENT_ID || process.env.CLIENT_ID === 'YOUR_CLIENT_ID_HERE' ||
    !process.env.GUILD_ID || process.env.GUILD_ID === 'YOUR_GUILD_ID_HERE') {
    console.error('错误：请在 .env 文件中提供有效的 DISCORD_TOKEN, CLIENT_ID, 和 GUILD_ID！');
    process.exit(1);
}

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./config.json');

const commands = [
  {
    name: config.commandName.toLowerCase().replace(/\s/g, '-'), // Command names must be lowercase and have no spaces
    description: config.commandDescription,
    options: [
      {
        name: 'user',
        type: 6, // USER type
        description: 'The user to vote to mute',
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    // 注意：这里需要您的 CLIENT_ID 和 GUILD_ID
    // 您需要将 .env 文件中的 YOUR_CLIENT_ID 和 YOUR_GUILD_ID 替换为实际值
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
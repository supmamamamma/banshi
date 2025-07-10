// 使用 'dotenv' 模块来从 .env 文件加载环境变量
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
if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.error('错误：请在 .env 文件中提供有效的 DISCORD_TOKEN！');
    process.exit(1);
}

// 从 discord.js 库中导入所需的类
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');
// 从本地文件系统导入配置文件
const config = require('./config.json');

// 创建一个新的 Discord 客户端实例
// 我们需要指定机器人需要哪些权限和事件，这被称为 "Intents"
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // 允许访问服务器（Guilds）相关信息
    GatewayIntentBits.GuildMessages, // 允许访问服务器消息
    GatewayIntentBits.GuildMessageReactions, // 允许访问消息的反应
    GatewayIntentBits.MessageContent, // 允许访问消息内容
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction], // 确保能处理未缓存的事件
});

// 用于存储投票信息
const activeVotes = new Map();

// 当客户端准备好运行时，这个事件会被触发
client.once('ready', () => {
  console.log(`机器人已上线! 登录为 ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const commandIdentifier = config.commandName.toLowerCase().replace(/\s/g, '-');

  if (interaction.commandName === commandIdentifier) {
    const targetUser = interaction.options.getUser('user');
    const initiator = interaction.user;

    if (targetUser.id === client.user.id) {
        return interaction.reply({ content: '你不能禁言我!', ephemeral: true });
    }

    if (targetUser.id === initiator.id) {
        return interaction.reply({ content: '你不能禁言你自己!', ephemeral: true });
    }

    const voteEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('🚫 禁言搬屎用户投票已启动')
      .setDescription(`有用户发起了禁言 **${targetUser.tag}** 的投票，请大家前往本消息添加 ${config.reactionEmoji} 反应来表达支持。`)
      .addFields(
        { name: '目标用户', value: `${targetUser}`, inline: true },
        { name: '发起人', value: `${initiator}`, inline: true },
        { name: '执行条件', value: `需要 ${config.reactionThreshold} 个 ${config.reactionEmoji} 反应` },
        { name: '当前 🚫 数量', value: '0' }
      )
      .setTimestamp()
      .setFooter({ text: '同一用户只计一票。' });

    const replyMessage = await interaction.reply({ embeds: [voteEmbed], fetchReply: true });
    await replyMessage.react(config.reactionEmoji);

    activeVotes.set(replyMessage.id, {
      targetUserId: targetUser.id,
      initiatorId: initiator.id,
      guildId: interaction.guild.id,
      channelId: interaction.channel.id,
      messageId: replyMessage.id,
      requiredVotes: config.reactionThreshold,
      voters: new Set(),
    });
  }
});

client.on('messageReactionAdd', async (reaction, user) => {
  // 如果是机器人自己添加的反应，则忽略
  if (user.bot) return;

  // 检查这个反应是否在我们关心的投票消息上
  if (activeVotes.has(reaction.message.id)) {
    const voteInfo = activeVotes.get(reaction.message.id);

    // 检查是否是正确的表情符号
    if (reaction.emoji.name === config.reactionEmoji) {
      // 检查用户是否已经投过票
      if (voteInfo.voters.has(user.id)) {
        // 可以选择在这里给用户发送一个临时消息提示他们已经投过票了
        return;
      }

      // 添加用户到已投票列表
      voteInfo.voters.add(user.id);
      const currentVotes = voteInfo.voters.size;

      // 更新投票消息
      const originalMessage = await client.channels.cache.get(voteInfo.channelId).messages.fetch(voteInfo.messageId);
      const originalEmbed = originalMessage.embeds[0];
      
      const updatedEmbed = new EmbedBuilder(originalEmbed.toJSON())
        .setFields(
            { name: '目标用户', value: `<@${voteInfo.targetUserId}>`, inline: true },
            { name: '发起人', value: `<@${voteInfo.initiatorId}>`, inline: true },
            { name: '执行条件', value: `需要 ${voteInfo.requiredVotes} 个 ${config.reactionEmoji} 反应` },
            { name: '当前 🚫 数量', value: `${currentVotes}` }
        );

      await originalMessage.edit({ embeds: [updatedEmbed] });

      // 检查是否达到禁言阈值
      if (currentVotes >= voteInfo.requiredVotes) {
        // 执行禁言操作
        await muteUser(voteInfo.guildId, voteInfo.targetUserId, user.tag);
        
        // 更新消息，宣告结果
        const finalEmbed = new EmbedBuilder(updatedEmbed.toJSON())
            .setColor(0xFF0000)
            .setTitle('🚫 投票成功！用户已被禁言')
            .setFooter({ text: '投票已结束。' });
        await originalMessage.edit({ embeds: [finalEmbed] });

        // 从活跃投票中移除
        activeVotes.delete(reaction.message.id);
      }
    }
  }
});

async function muteUser(guildId, userId, responsibleUserTag) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);

    if (member) {
      // 将分钟转换为毫秒
      const duration = config.muteDurationMinutes * 60 * 1000;
      await member.timeout(duration, `由 ${responsibleUserTag} 发起的投票决定`);
      console.log(`成功禁言用户 ${member.user.tag}，时长 ${config.muteDurationMinutes} 分钟。`);
    } else {
      console.log('无法在服务器上找到该用户。');
    }
  } catch (error) {
    console.error('禁言用户时发生错误:', error);
    // 在这里，您可以向频道发送一条消息，告知管理员发生了错误，可能是权限不足
  }
}

// 登录到 Discord
client.login(process.env.DISCORD_TOKEN);

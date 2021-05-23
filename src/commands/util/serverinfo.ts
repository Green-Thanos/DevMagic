import { Message } from "discord.js";
import Command from "../../structures/Command";
import Bot from "../../structures/Bot";

export default class ServerInfoCommand extends Command {
  constructor(bot: Bot) {
    super(bot, {
      name: "serverinfo",
      description: "Get info about the server",
      category: "util",
      aliases: ["guild", "server"],
    });
  }

  async execute(bot: Bot, message: Message) {
    const lang = await bot.utils.getGuildLang(message.guild?.id);

    try {
      const { guild } = message;

      if (!guild) return message.channel.send(lang.GLOBAL.ERROR);
      if (!message.member) return message.channel.send(lang.GLOBAL.ERROR);

      const { name, memberCount } = guild;
      const roles = bot.utils.formatNumber(guild.roles.cache.size);
      const channels = bot.utils.formatNumber(guild.channels.cache.size);
      const emojis = bot.utils.formatNumber(guild.emojis.cache.size);

      const regions = lang.OTHER.REGIONS;
      const verLevels = lang.OTHER.VERLEVELS;

      const { date: createdAt } = await bot.utils.formatDate(guild.createdAt, message.guild?.id);
      const { date: joined, tz } = await bot.utils.formatDate(
        message.member?.joinedAt,
        message.guild?.id,
      );
      const owner = await guild.fetchOwner();
      const inviteBanner = guild.bannerURL({
        size: 2048,
        format: "png",
      });

      const region = regions[guild.region];
      const verLevel = verLevels[guild.verificationLevel];
      const mfaLevel = guild.mfaLevel;

      const embed = bot.utils
        .baseEmbed(message)
        .setTitle(name)
        .setDescription(
          `
  **${lang.GUILD.OWNER}:** ${owner}
  **${lang.GUILD.REGION}:** ${region}
  **${lang.GUILD.MFA}:** ${mfaLevel}
  **${lang.GUILD.VERIFICATION}:** ${verLevel}

  **${lang.MEMBER.JOINED_AT}:** ${joined} (${tz})
  **${lang.MEMBER.CREATED_ON}:** ${createdAt} (${tz})`,
        )
        .addField(
          "**📈 Stats**",
          `
  **${lang.GUILD.ROLES_C}:** ${roles}
  **${lang.GUILD.CHANNEL_C}:** ${channels}
  **${lang.GUILD.EMOJI_C}:** ${emojis}
  **${lang.GUILD.MEMBER_C}:** ${memberCount}`,
        );

      if (inviteBanner !== null) {
        embed.setImage(inviteBanner);
      }

      if (guild.icon !== null) {
        embed.setThumbnail(`${guild.iconURL({ format: "png", size: 1024 })}`);
      }

      message.channel.send(embed);
    } catch (err) {
      bot.utils.sendErrorLog(err, "error");
      return message.channel.send(lang.GLOBAL.ERROR);
    }
  }
}

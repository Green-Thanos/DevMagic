import Command from "../../structures/Command";
import Bot from "../../structures/Bot";
import { Message, MessageEmbed } from "discord.js";

export default class QueueCommand extends Command {
  constructor(bot: Bot) {
    super(bot, {
      name: "queue",
      description: "Show top 20 songs in the queue",
      aliases: ["q"],
      category: "music",
    });
  }
  async execute(bot: Bot, message: Message) {
    const lang = await bot.utils.getGuildLang(message.guild?.id);

    function generateQueueEmbed(message, queue) {
      const embeds : MessageEmbed[] = [];
      let k = 10;
    
      for (let i = 0; i < queue.length; i += 10) {
        const current = queue.slice(i, k);
        let j = i;
        k += 10;
    
        const info = current.map((track) => `${++j} - [${track.title}](${track.url})`).join("\n");
    
        const embed = bot.utils
          .baseEmbed(message)
          .setTitle(lang.MUSIC.QUEUE)
          .setThumbnail(message.guild.iconURL())
          .setTimestamp()
          .setDescription(`**${lang.MUSIC.PLAYING} - [${queue[0].title}](${queue[0].url})**\n\n${info}`);
        embeds.push(embed);
      }
    
      return embeds;
    }

    try {
      if (!message.member?.voice.channel) {
        return message.channel.send(lang.MUSIC.MUST_BE_IN_VC);
      }

      const queue = bot.player.getQueue(message);

      if (!queue) {
        return message.channel.send(lang.MUSIC.NO_QUEUE);
      }
      let currentPage = 0;
      const embeds = generateQueueEmbed(message, queue.tracks);

      const queueEmbed = await message.channel.send(
        `**Page - ${currentPage + 1}/${embeds.length}**`,
        embeds[currentPage]
      );

      try {
        await queueEmbed.react("⬅️");
        await queueEmbed.react("⏹");
        await queueEmbed.react("➡️");
      } catch (error) {
        console.error(error);
        message.channel.send(error.message).catch(console.error);
      }

      const filter = (reaction, user) =>
        ["⬅️", "⏹", "➡️"].includes(reaction.emoji.name) && message.author.id === user.id;
      const collector = queueEmbed.createReactionCollector(filter, { time: 60000 });

      collector.on("collect", async (reaction) => {
        try {
          if (reaction.emoji.name === "➡️") {
            if (currentPage < embeds.length - 1) {
              currentPage++;
              queueEmbed.edit(`**Page - ${currentPage + 1}/${embeds.length}**`, embeds[currentPage]);
            }
          } else if (reaction.emoji.name === "⬅️") {
            if (currentPage !== 0) {
              --currentPage;
              queueEmbed.edit(`**Page - ${currentPage + 1}/${embeds.length}**`, embeds[currentPage]);
            }
          } else {
            collector.stop();
            reaction.message.reactions.removeAll();
          }
          await reaction.users.remove(message.author.id);
        } catch (error) {
          console.error(error);
          return message.channel.send(error.message).catch(console.error);
        }
        });
    } catch (err) {
      bot.utils.sendErrorLog(err, "error");
      return message.channel.send(lang.GLOBAL.ERROR);
    }
  }
}
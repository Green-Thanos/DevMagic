import { Message, TextChannel, Permissions } from "discord.js";
import Command from "../../structures/Command";
import Bot from "../../structures/Bot";

export default class DeleteCommand extends Command {
  constructor(bot: Bot) {
    super(bot, {
      name: "delete",
      description: "Delete message, up to 100",
      usage: "<1-100>",
      aliases: ["purge", "clear"],
      category: "admin",
      memberPermissions: [Permissions.FLAGS.MANAGE_MESSAGES],
      botPermissions: [Permissions.FLAGS.MANAGE_MESSAGES],
      requiredArgs: [{ name: "amount", type: "number" }],
    });
  }

  async execute(bot: Bot, message: Message, args: string[]) {
    const lang = await bot.utils.getGuildLang(message.guild?.id);
    let amount = +args[0];

    if (isNaN(amount) || amount > 100) {
      return message.channel.send(lang.ADMIN.DELETE_PROVIDE_AMOUNT);
    }

    amount = +args[0] === 100 ? +args[0] : +args[0] + 1;

    try {
      await (message.channel as TextChannel).bulkDelete(Number(amount)).then(() => {
        message.channel
          .send(lang.ADMIN.DELETE_DELETED.replace("{amount}", `${amount}`))
          .then((msg) => {
            setTimeout(() => {
              msg.deletable && msg.delete();
            }, 2000);
          });
      });
    } catch {
      return message.channel.send(lang.ADMIN.DELETE_ERROR);
    }
  }
}

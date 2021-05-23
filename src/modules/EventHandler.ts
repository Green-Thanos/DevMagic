import { PlayerEvents } from "discord-player";
import { StarboardEvents } from "discord-starboards";
import glob from "glob";
import { parse } from "path";
import Bot from "../structures/Bot";
import Event from "../structures/Event";

const types = ["channel", "client", "guild", "message", "player", "sb"];

export default class EventHandler {
  bot: Bot;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  async loadEvents() {
    let type = "Bot";

    const files = process.env.BUILD_PATH
      ? glob.sync("./dist/src/events/**/*.js")
      : glob.sync("./src/events/**/*.ts");
    const path = process.env.BUILD_PATH ? "../../../" : "../../";

    for (const file of files) {
      delete require.cache[file];
      const { name } = parse(`${path}${file}`);

      if (!name) {
        throw Error(`[ERROR][EVENT]: event must have a name (${file})`);
      }

      const File = await (await import(`${path}/${file}`)).default;
      const event = new File(this.bot, name) as Event;
      const isPlayer = file.includes("player.");
      const isStarboard = file.includes("sb.");

      types.forEach((t) => {
        if (file.includes(`${t}.`)) {
          type = t;
        }
      });

      if (!event.execute) {
        throw new TypeError(`[ERROR][events]: execute function is required for events! (${file})`);
      }

      if (isPlayer) {
        this.bot.player.on(event.name as keyof PlayerEvents, event.execute.bind(null, this.bot));
      } else if (isStarboard) {
        this.bot.starboardsManager.on(
          event.name as keyof StarboardEvents,
          event.execute.bind(null, this.bot),
        );
      } else {
        this.bot.on(event.name, event.execute.bind(null, this.bot));
      }

      if (process.env["DEBUG_MODE"] === "true") {
        this.bot.logger.log("EVENT", `${type}: Loaded ${event.name}`);
      }
    }
  }
}

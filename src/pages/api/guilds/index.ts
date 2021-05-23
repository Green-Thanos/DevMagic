import { NextApiResponse } from "next";
import { Permissions } from "discord.js";
import hiddenItems from "../../../data/hidden-items.json";
import ApiRequest from "../../../interfaces/ApiRequest";
import Guild from "../../../interfaces/Guild";

export default async function handler(req: ApiRequest, res: NextApiResponse) {
  const { method, headers } = req;

  switch (method) {
    case "GET": {
      const token = req.cookies.token || headers.auth;
      const guilds = await req.bot.utils.handleApiRequest(
        "/users/@me/guilds",
        { data: `${token}`, type: "Bearer" },
        "GET",
      );

      if (guilds.error || guilds.message) {
        return res.json({
          error: guilds.error || guilds.message,
          status: "error",
          invalid_token: guilds.error === "invalid_token",
        });
      }

      const isAdminGuilds = guilds.filter((guild: Guild) => {
        const bits = BigInt(guild.permissions as number);
        const permissions = new Permissions(bits);

        return permissions.has("ADMINISTRATOR");
      });

      const filteredGuilds = isAdminGuilds.map((guild: Guild) => {
        const g = req.bot.guilds.cache.get(guild.id);
        return {
          ...guild,
          ...g,
          inGuild: g ? true : false,
        };
      });

      filteredGuilds.forEach((guild: Guild) => {
        hiddenItems.forEach((item) => {
          return (guild[item] = undefined);
        });
      });

      return res.json(
        JSON.stringify({ guilds: filteredGuilds }, (_, value) => {
          return typeof value === "bigint" ? value.toString() : value;
        }),
      );
    }
    default: {
      return res.status(405).json({ error: "Method not allowed", status: "error" });
    }
  }
}

const { ChannelType } = require("discord.js");
const { readBirthdays } = require("./store");
const { todayKey } = require("./date");
const { CHANNEL_NAME } = require("./config");

async function checkAndNotify(client) {
  const today = todayKey();
  const birthdays = readBirthdays();
  const matches = birthdays.filter(b => b.date === today);

  if (!matches.length) return;

  for (const guild of client.guilds.cache.values()) {
    const channel = guild.channels.cache.find(
      c => c.type === ChannelType.GuildText && c.name === CHANNEL_NAME
    );
    if (!channel) continue;

    for (const b of matches) {
      const msg = b.message || `🎉 Happy Birthday <@${b.userId}>! 🎂`;
      // eslint-disable-next-line no-await-in-loop
      await channel.send(msg);
    }
  }
}

module.exports = { checkAndNotify };

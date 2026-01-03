const { ChannelType } = require("discord.js");
const { readBirthdays } = require("../store");
const { todayKey } = require("../date");
const { CHANNEL_NAME } = require("../config");

async function checkBirthdays(client) {
  const birthdays = readBirthdays();
  const birthdayMatches = birthdays.filter(b => b.date === todayKey());
  if (!birthdayMatches.length) return;

  for (const guild of client.guilds.cache.values()) {
    const channel = guild.channels.cache.find(
      c => c.type === ChannelType.GuildText && c.name === CHANNEL_NAME
    );
    if (!channel) continue;

    for (const b of birthdayMatches) {
      // eslint-disable-next-line no-await-in-loop
      await channel.send(
        `🎉 **Happy Birthday <@${b.userId}>!** 🎂${b.message ? `\n> ${b.message}` : ""}`
      );
    }
  }
}

module.exports = { checkBirthdays };

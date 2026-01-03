const { ChannelType } = require("discord.js");
const fs = require("fs");
const { readBirthdays } = require("./store");
const { todayKey } = require("./date");
const { CHANNEL_NAME, HOLIDAYS_PATH } = require("./config");

async function checkAndNotify(client) {
  // ---- DATE (ISO) ----
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const todayIso = `${yyyy}-${mm}-${dd}`;

  // ---- BIRTHDAYS ----
  const birthdays = readBirthdays();
  const birthdayMatches = birthdays.filter(b => b.date === todayKey());

  // ---- HOLIDAYS ----
  let parsed;
  let holidayMatches = [];
  try {
    const raw = fs.readFileSync(HOLIDAYS_PATH, "utf8");
    parsed = JSON.parse(raw);
    holidayMatches = parsed.holidays?.filter(h => h.date === todayIso) || [];
  } catch (err) {
    console.error("Holiday JSON read error:", err);
  }

  for (const guild of client.guilds.cache.values()) {
    const channel = guild.channels.cache.find(
      c => c.type === ChannelType.GuildText && c.name === CHANNEL_NAME
    );
    if (!channel) continue;

    // 🎂 Birthdays
    for (const b of birthdayMatches) {
      await channel.send(
        `🎉 **Happy Birthday <@${b.userId}>!** 🎂${
          b.message ? `\n> ${b.message}` : ""
        }`
      );
    }

    // 🎊 Holidays
    for (const h of holidayMatches) {
      const lines = [];

      // Header
      lines.push(`📅 **${h.name}**`);

      // Type
      if (h.type) {
        lines.push(`• ${h.type}`);
      }

      // Optional holiday block (ONLY when optional)
      if (h.type === "Optional") {
        lines.push(`• You can choose this OR **14th January**`);
        lines.push(`• Please inform if you’re taking off today`);
      }

      // Note (weekend etc.)
      if (h.note) {
        lines.push(`> ${h.note}`);
      }

      // Footer
      lines.push(``);
      lines.push(`🎉 Enjoy the holiday! 🥳`);

      await channel.send(lines.join("\n"));
    }
  }
}

module.exports = { checkAndNotify };

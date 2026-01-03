const { ChannelType } = require("discord.js");
const fs = require("fs");
const { CHANNEL_NAME, HOLIDAYS_PATH } = require("../config");

function todayIso() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function checkHolidays(client) {
  let holidayMatches = [];
  try {
    const raw = fs.readFileSync(HOLIDAYS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    holidayMatches = parsed.holidays?.filter(h => h.date === todayIso()) || [];
  } catch (err) {
    console.error("Holiday JSON read error:", err);
  }

  if (!holidayMatches.length) return;

  for (const guild of client.guilds.cache.values()) {
    const channel = guild.channels.cache.find(
      c => c.type === ChannelType.GuildText && c.name === CHANNEL_NAME
    );
    if (!channel) continue;

    for (const h of holidayMatches) {
      const lines = [];
      lines.push(`📅 **${h.name}**`);
      if (h.type) {
        lines.push(`• ${h.type}`);
      }
      if (h.type === "Optional") {
        lines.push(`• You can choose this OR **14th January**`);
        lines.push(`• Please inform if you’re taking off today`);
      }
      if (h.note) {
        lines.push(`> ${h.note}`);
      }
      lines.push("");
      lines.push(`🎉 Enjoy the holiday! 🥳`);
      // eslint-disable-next-line no-await-in-loop
      await channel.send(lines.join("\n"));
    }
  }
}

module.exports = { checkHolidays };

require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const { checkAndNotify } = require("./src/checker");
const { msUntilTime } = require("./src/date");
const { registerSlashCommands, handleInteraction } = require("./src/slash");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const CHECK_HOUR = Number.parseInt(process.env.BIRTHDAY_CHECK_HOUR ?? "8", 10);
const CHECK_MINUTE = Number.parseInt(process.env.BIRTHDAY_CHECK_MINUTE ?? "0", 10);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});


client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  if (!clientId) {
    console.warn("⚠ Missing DISCORD_CLIENT_ID; slash commands not registered.");
  } else {
    try {
      await registerSlashCommands(token, clientId, guildId);
    } catch (e) {
      console.error("Failed to register slash commands:", e);
    }
  }

  // Optional immediate one-time check for testing: set BIRTHDAY_CHECK_NOW=1
  if (process.env.BIRTHDAY_CHECK_NOW === "1") {
    try {
      await checkAndNotify(client);
    } catch (e) {
      console.error("Immediate check failed:", e);
    }
  }

  const initialDelay = msUntilTime(CHECK_HOUR, CHECK_MINUTE);
  setTimeout(() => {
    checkAndNotify(client);
    setInterval(() => checkAndNotify(client), 24 * 60 * 60 * 1000);
  }, initialDelay);
});


client.on(Events.InteractionCreate, async interaction => {
  try {
    await handleInteraction(interaction);
  } catch (e) {
    console.error("interaction error", e);
    if (interaction.isRepliable && interaction.isRepliable()) {
      try { await interaction.reply({ content: "❌ Error", ephemeral: true }); } catch {}
    }
  }
});


if (!token) {
  console.error("❌ Missing DISCORD_TOKEN");
  process.exit(1);
}

client.login(token);


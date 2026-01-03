const { REST, Routes } = require("discord.js");
const { readBirthdays, saveBirthdays } = require("./store");
const { normalizeDate } = require("./date");
const fs = require("fs");
const { HOLIDAYS_PATH } = require("./config");

const commands = [
  {
    name: "addbirthday",
    description: "Add a birthday for a user (MM-DD)",
    default_member_permissions: "8",
    dm_permission: false,
    options: [
      { name: "user", description: "User to add", type: 6, required: true },
      { name: "date", description: "MM-DD (e.g., 12-05)", type: 3, required: true },
      { name: "message", description: "Custom message", type: 3, required: false }
    ]
  },
  {
    name: "updatebirthday",
    description: "Update an existing user's birthday (MM-DD)",
    default_member_permissions: "8",
    dm_permission: false,
    options: [
      { name: "user", description: "User to update", type: 6, required: true },
      { name: "date", description: "MM-DD (e.g., 12-05)", type: 3, required: true },
      { name: "message", description: "Custom message", type: 3, required: false }
    ]
  },
  {
    name: "removebirthday",
    description: "Remove a user's birthday",
    default_member_permissions: "8",
    dm_permission: false,
    options: [
      { name: "user", description: "User to remove", type: 6, required: true }
    ]
  },
  {
    name: "listbirthdays",
    description: "List all saved birthdays",
    default_member_permissions: "8",
    dm_permission: false,
  }
  ,
  {
    name: "holidays",
    description: "Show company holidays",
    dm_permission: false
  },
  {
    name: "leave-policy",
    description: "Show company leave policy",
    dm_permission: false
  }
];

async function registerSlashCommands(token, clientId, guildId) {
  const rest = new REST({ version: "10" }).setToken(token);
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log("Registered guild slash commands");
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("Registered global slash commands (may take up to 1h to appear)");
  }
}

async function handleInteraction(interaction) {
  if (!interaction.isChatInputCommand()) return;
  // Ensure we acknowledge the interaction within 3s to prevent Unknown interaction (10062)
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: true });
  }

  // Enforce admin-only access for mutating commands
  const adminOnly = new Set(["addbirthday", "updatebirthday", "removebirthday"]);
  if (adminOnly.has(interaction.commandName)) {
    const hasAdmin = interaction.memberPermissions && interaction.memberPermissions.has(0x0000000000000008n);
    if (!hasAdmin) {
      return interaction.editReply({ content: "❌ You don't have permission to use this command." });
    }
  }

  if (interaction.commandName === "addbirthday") {
    const user = interaction.options.getUser("user");
    const rawDate = interaction.options.getString("date");
    const msg = interaction.options.getString("message");
    const date = normalizeDate(rawDate);
    if (!date) return interaction.editReply({ content: "❌ Invalid date. Use MM-DD" });

    const data = readBirthdays();
    if (data.find(b => b.userId === user.id)) {
      return interaction.editReply({ content: "⚠ Already exists. Use /updatebirthday" });
    }
    data.push({
      userId: user.id,
      date,
      message: msg || undefined,
      username: user.username,
      displayName: user.globalName || user.username
    });
    saveBirthdays(data);
    return interaction.editReply({ content: `✅ Added for <@${user.id}> → ${date}` });
  }

  if (interaction.commandName === "updatebirthday") {
    const user = interaction.options.getUser("user");
    const rawDate = interaction.options.getString("date");
    const msg = interaction.options.getString("message");
    const date = normalizeDate(rawDate);
    if (!date) return interaction.editReply({ content: "❌ Invalid date. Use MM-DD" });

    const data = readBirthdays();
    const found = data.find(b => b.userId === user.id);
    if (!found) return interaction.editReply({ content: "❌ Not found" });

    found.date = date;
    // keep stored identity fresh
    found.username = user.username;
    found.displayName = user.globalName || user.username;
    if (msg !== null) found.message = msg || undefined;
    saveBirthdays(data);
    return interaction.editReply({ content: `♻ Updated for <@${user.id}> → ${date}` });
  }

  if (interaction.commandName === "removebirthday") {
    const user = interaction.options.getUser("user");
    let data = readBirthdays();
    const before = data.length;
    data = data.filter(b => b.userId !== user.id);
    if (data.length === before) return interaction.editReply({ content: "❌ Not found" });
    saveBirthdays(data);
    return interaction.editReply({ content: `🗑 Removed for <@${user.id}>` });
  }

  if (interaction.commandName === "listbirthdays") {
    const data = readBirthdays();
    if (!data.length) return interaction.editReply({ content: "No birthdays saved" });
    const items = await Promise.all(
      data.map(async b => {
        let name = b.displayName || b.username;
        if (!name) {
          try {
            const u = await interaction.client.users.fetch(b.userId);
            name = u.globalName || u.username;
          } catch { }
        }
        return { mention: `<@${b.userId}>`, date: b.date, name };
      })
    );
    const payload = { items };
    const pretty = '```json\n' + JSON.stringify(payload, null, 2) + '\n```';
    return interaction.editReply({ content: pretty });
  }

  if (interaction.commandName === "holidays") {
    try {
      const raw = fs.readFileSync(HOLIDAYS_PATH, "utf8");
      const json = JSON.parse(raw);

      const company = json.company || "Company";
      const year = json.year || new Date().getFullYear();
      const list = Array.isArray(json.holidays) ? json.holidays : [];

      const groups = {
        Optional: [],
        "National Holiday": [],
        "Mandatory Holiday": [],
        "State Holiday": []
      };

      for (const h of list) {
        if (h.type && groups[h.type]) {
          groups[h.type].push(h);
        }
      }

      const fmt = d => {
        const dt = new Date(d);
        return dt.toLocaleDateString("en-IN", {
          month: "short",
          day: "2-digit",
          weekday: "short"
        });
      };

      const lines = [];
      lines.push(`**🌴 Holidays — ${company} ${year}**\n`);

      if (groups.Optional.length) {
        lines.push(`**🟡 Optional Holidays**`);
        groups.Optional.forEach(h =>
          lines.push(`• **${fmt(h.date)}** — ${h.name}`)
        );
        lines.push(`> _Choose **one** of the above_\n`);
      }

      if (groups["National Holiday"].length) {
        lines.push(`**🔴 National Holidays**`);
        groups["National Holiday"].forEach(h =>
          lines.push(`• **${fmt(h.date)}** — ${h.name}`)
        );
        lines.push("");
      }

      if (groups["Mandatory Holiday"].length) {
        lines.push(`**🟢 Mandatory Holidays**`);
        groups["Mandatory Holiday"].forEach(h =>
          lines.push(`• **${fmt(h.date)}** — ${h.name}`)
        );
        lines.push("");
      }

      if (groups["State Holiday"].length) {
        lines.push(`**🔵 State Holiday**`);
        groups["State Holiday"].forEach(h =>
          lines.push(`• **${fmt(h.date)}** — ${h.name}`)
        );
      }

      return interaction.editReply({ content: lines.join("\n") });
    } catch (e) {
      return interaction.editReply({ content: "❌ Failed to load holidays." });
    }
  }


  if (interaction.commandName === "leave-policy") {
    try {
      const raw = fs.readFileSync(HOLIDAYS_PATH, "utf8");
      const json = JSON.parse(raw);

      const company = json.company || "Company";
      const year = json.year || new Date().getFullYear();
      const p = json.leave_policy || {};

      const lines = [];

      if (p.optional_holiday_rule)
        lines.push(`• **Optional Holiday:** ${p.optional_holiday_rule}`);

      if (p.mandatory_leaves != null)
        lines.push(`• **Mandatory Leaves:** ${p.mandatory_leaves}`);

      if (p.sick_leaves)
        lines.push(`• **Sick Leaves:** ${p.sick_leaves}`);

      if (p.planned_leaves)
        lines.push(`• **Planned Leaves:** ${p.planned_leaves}`);

      if (p.additional_leave)
        lines.push(`• **Additional:** ${p.additional_leave}`);

      const content = [
        `**Leave Policy — ${company} ${year}**`,
        "",
        lines.length ? lines.join("\n") : "_No leave policy found_"
      ].join("\n");

      return interaction.editReply({ content });
    } catch (e) {
      return interaction.editReply({ content: "❌ Failed to load leave policy." });
    }
  }

}

module.exports = { registerSlashCommands, handleInteraction, commands };

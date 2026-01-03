const { ChannelType } = require("discord.js");
const fs = require("fs");
const { readBirthdays } = require("./store");
const { todayKey } = require("./date");
const { CHANNEL_NAME, HOLIDAYS_PATH } = require("./config");
const { checkBirthdays } = require("./checkers/birthday");
const { checkHolidays } = require("./checkers/holiday");

async function checkAndNotify(client) {
  await checkBirthdays(client);
  await checkHolidays(client);
  
}

module.exports = { checkAndNotify };

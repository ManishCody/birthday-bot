const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "birthdays.json");
const CHANNEL_NAME = "birthday-wishes";

const HOLIDAYS_PATH = path.join(__dirname, "..", "data", "holiday.json");

module.exports = { DATA_PATH, CHANNEL_NAME, HOLIDAYS_PATH };

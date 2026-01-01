const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "birthdays.json");
const CHANNEL_NAME = "birthday-wishes";

module.exports = { DATA_PATH, CHANNEL_NAME };

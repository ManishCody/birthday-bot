const fs = require("fs");
const { DATA_PATH } = require("./config");

function readBirthdays() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch {
    return [];
  }
}

function saveBirthdays(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readBirthdays, saveBirthdays };

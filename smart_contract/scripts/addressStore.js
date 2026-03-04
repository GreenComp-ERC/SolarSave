const fs = require("fs");
const path = require("path");

const storePath = path.join(__dirname, "contractAddress.json");
const clientStorePath = path.resolve(__dirname, "..", "..", "client", "src", "utils", "contractAddress.json");

const readJson = (filePath) => {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
};

const writeJson = (filePath, data) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const readAddresses = () => readJson(storePath);

const writeAddresses = (updates) => {
  const current = readJson(storePath);
  const next = { ...current, ...updates };
  writeJson(storePath, next);
  writeJson(clientStorePath, next);
  return next;
};

module.exports = {
  readAddresses,
  writeAddresses,
};

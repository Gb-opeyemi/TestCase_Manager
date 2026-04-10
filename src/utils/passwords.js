const crypto = require("crypto");

const HASH_PREFIX = "scrypt";
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

function hashPassword(password) {
  // This turns a plain password into a stored hash.
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${HASH_PREFIX}$${salt}$${hash}`;
}

function isHashedPassword(value = "") {
  // This checks if the password is already hashed.
  return value.startsWith(`${HASH_PREFIX}$`);
}

function verifyPassword(password, storedPassword = "") {
  // This compares the login password with the saved hash.
  if (!isHashedPassword(storedPassword)) {
    return storedPassword === password;
  }

  const [, salt, savedHash] = storedPassword.split("$");
  const passwordHash = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  const savedBuffer = Buffer.from(savedHash, "hex");
  const passwordBuffer = Buffer.from(passwordHash, "hex");

  if (savedBuffer.length !== passwordBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(savedBuffer, passwordBuffer);
}

module.exports = {
  hashPassword,
  isHashedPassword,
  verifyPassword,
};

const ROLE_OPTIONS = ["Admin", "Tester", "Developer", "Stakeholder"];
const STATUS_OPTIONS = ["Pending", "Passed", "Failed"];
const LEVEL_OPTIONS = ["Low", "Medium", "High"];

function readValue(value, fallback = "") {
  // This turns request input into a trimmed string.
  return value?.toString().trim() || fallback;
}

function hasMaxLength(value, maxLength) {
  // This checks if the text stays within the max length.
  return value.length <= maxLength;
}

function isValidEmail(value) {
  // This checks if the text looks like an email address.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidId(value) {
  // This checks if the id is a positive whole number.
  return /^\d+$/.test(value) && Number(value) > 0;
}

function isValidOption(value, allowedOptions) {
  // This checks if the value is one of the allowed options.
  return allowedOptions.includes(value);
}

function isValidMediaUrl(value) {
  // This checks if the media link uses http or https.
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (error) {
    return false;
  }
}

module.exports = {
  LEVEL_OPTIONS,
  ROLE_OPTIONS,
  STATUS_OPTIONS,
  hasMaxLength,
  isValidEmail,
  isValidId,
  isValidMediaUrl,
  isValidOption,
  readValue,
};

function escapeSqlValue(value = "") {
  // This escapes single quotes before building SQL strings.
  return value.replace(/'/g, "''");
}

module.exports = {
  escapeSqlValue,
};

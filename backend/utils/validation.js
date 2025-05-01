/**
 * Validates a UUID format string
 * @param {string} uuid - The UUID to validate
 * @returns {boolean} - True if valid UUID
 */
exports.validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validates a 5-digit ID format
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid 5-digit ID
 */
exports.validate5DigitId = (id) => {
  return /^\d{5}$/.test(id);
};
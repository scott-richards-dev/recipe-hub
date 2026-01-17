const fs = require('fs').promises;
const path = require('path');

/**
 * Read and parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<Object>} Parsed JSON data
 */
async function readJsonFile(filePath) {
  const data = await fs.readFile(filePath, 'utf8');
  return JSON.parse(data);
}

/**
 * Write data to a JSON file
 * @param {string} filePath - Path to the JSON file
 * @param {Object} data - Data to write
 * @returns {Promise<void>}
 */
async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Get the path to a data file
 * @param {string} filename - Name of the data file
 * @returns {string} Full path to the file
 */
function getDataPath(filename) {
  return path.join(__dirname, '../data', filename);
}

module.exports = {
  readJsonFile,
  writeJsonFile,
  getDataPath
};

const VALID_ACTIONS = ['enable', 'disable', 'purge'];

/**
 * Retrieves an environment variable value by key.
 * If the key is not found in `process.env`,
 *   it will also check for an environment variable with the prefix `INPUT_`.
 * If the value is not found, it will return the provided fallback.
 * @param {string} key - The key of the environment variable
 * @param {string} [fallback=''] - The fallback value if the key is not found
 * @returns {string} The value of the environment variable
 */
function fromEnv(key, fallback = '') {
  const has = Object.prototype.hasOwnProperty.call(process.env, key);
  const v = has ? process.env[key] : process.env[`INPUT_${key}`];
  return v === undefined || v === null || v === '' ? fallback : v;
}

/**
 * Retrieves the configuration object based on the environment variables.
 * The configuration object contains the following properties:
 * - email: The email address of the Cloudways account
 * - apiKey: The API key of the Cloudways account
 * - serverId: The server ID of the Cloudways server
 * - action: The action to perform on the Cloudways server (enable, disable, purge)
 * - waitForCompletion: Whether to wait for the completion of the action (true, false)
 * @returns {Object} The configuration object
 */
function getInputs() {
  return {
    email: fromEnv('CLOUDWAYS_EMAIL'),
    apiKey: fromEnv('CLOUDWAYS_API_KEY'),
    serverId: fromEnv('CLOUDWAYS_SERVER_ID'),
    action: fromEnv('ACTION', 'enable').toLowerCase(),
    waitForCompletion: fromEnv('WAIT_FOR_COMPLETION', 'true') === 'true'
  };
}

/**
 * Asserts that the required inputs are present and valid.
 * If any of the required inputs are missing, it will throw an Error.
 * If the ACTION is not one of the valid actions, it will also throw an Error.
 * @param {Object} cfg - The configuration object
 * @throws {Error} If any of the required inputs are missing or invalid
 */
function assertRequired(cfg) {
  const missing = [];
  if (!cfg.email) missing.push('CLOUDWAYS_EMAIL');
  if (!cfg.apiKey) missing.push('CLOUDWAYS_API_KEY');
  if (!cfg.serverId) missing.push('CLOUDWAYS_SERVER_ID');

  if (missing.length) {
    throw new Error(`Missing required inputs: ${missing.join(', ')}`);
  }

  if (!VALID_ACTIONS.includes(cfg.action)) {
    throw new Error(`Invalid ACTION '${cfg.action}'. Must be one of: ${VALID_ACTIONS.join(', ')}`);
  }
}

module.exports = {
  getInputs,
  assertRequired,
  VALID_ACTIONS
};

const { DEFAULT_API_URL } = require('./client');

const VALID_ACTIONS = ['enable', 'disable', 'purge'];

/**
 * Read an input value from the environment.
 * Looks for the bare key first, then `INPUT_<key>` (the convention GitHub Actions uses).
 *
 * @since 1.0.0
 * @param {string} key        - environment variable name
 * @param {string} [fallback] - value to return if the key is unset or empty
 * @returns {string}
 */
function fromEnv(key, fallback = '') {
  const has = Object.prototype.hasOwnProperty.call(process.env, key);
  const v = has ? process.env[key] : process.env[`INPUT_${key}`];
  return v === undefined || v === null || v === '' ? fallback : v;
}

/**
 * Build the configuration object from action inputs.
 *
 * @since 1.0.0
 * @returns {object}
 */
function getInputs() {
  return {
    apiToken: fromEnv('CLOUDWAYS_API_TOKEN'),
    email: fromEnv('CLOUDWAYS_EMAIL'),
    apiKey: fromEnv('CLOUDWAYS_API_KEY'),
    serverId: fromEnv('CLOUDWAYS_SERVER_ID'),
    action: fromEnv('ACTION', 'enable').toLowerCase(),
    apiUrl: fromEnv('CLOUDWAYS_API_URL', DEFAULT_API_URL)
  };
}

/**
 * Validate inputs. Needs CLOUDWAYS_API_TOKEN, or CLOUDWAYS_EMAIL + CLOUDWAYS_API_KEY, and a valid ACTION.
 *
 * @since 1.0.0
 * @param {object} cfg - configuration object from getInputs()
 * @returns {void}
 */
function assertRequired(cfg) {
  const missing = [];
  if (!cfg.apiToken) {
    if (!cfg.email && !cfg.apiKey) missing.push('CLOUDWAYS_API_TOKEN');
    else if (!cfg.email) missing.push('CLOUDWAYS_EMAIL');
    else if (!cfg.apiKey) missing.push('CLOUDWAYS_API_KEY');
  }
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

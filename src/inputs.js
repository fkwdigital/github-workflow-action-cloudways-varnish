const VALID_ACTIONS = ['enable', 'disable', 'purge'];

function fromEnv(key, fallback = '') {
  const has = Object.prototype.hasOwnProperty.call(process.env, key);
  const v = has ? process.env[key] : process.env[`INPUT_${key}`];
  return v === undefined || v === null || v === '' ? fallback : v;
}

function getInputs() {
  return {
    email: fromEnv('CLOUDWAYS_EMAIL'),
    apiKey: fromEnv('CLOUDWAYS_API_KEY'),
    serverId: fromEnv('CLOUDWAYS_SERVER_ID'),
    action: fromEnv('ACTION', 'enable').toLowerCase(),
    waitForCompletion: fromEnv('WAIT_FOR_COMPLETION', 'true') === 'true'
  };
}

function assertRequired(cfg) {
  const missing = [];
  if (!cfg.email) missing.push('CLOUDWAYS_EMAIL');
  if (!cfg.apiKey) missing.push('CLOUDWAYS_API_KEY');
  if (!cfg.serverId) missing.push('SERVER_ID');

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

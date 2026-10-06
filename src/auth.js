const { request } = require('./client');

/**
 * Exchange the legacy email + API key for an OAuth access token.
 *
 * @since 1.0.0
 * @param {object} opts
 * @param {string} opts.email    - Cloudways account email
 * @param {string} opts.apiKey   - legacy Cloudways API key
 * @param {string} [opts.apiUrl] - API base URL
 * @return {Promise<string>} The OAuth access token.
 */
async function getAccessToken({ email, apiKey, apiUrl }) {
  console.log('[API] Obtaining OAuth access token...');

  const data = await request({
    apiUrl,
    method: 'POST',
    path: '/oauth/access_token',
    body: { email, api_key: apiKey }
  });

  if (!data.access_token) {
    throw new Error(`Failed to obtain access token: ${JSON.stringify(data)}`);
  }

  console.log('✅ [API] Access token obtained');
  return data.access_token;
}

/**
 * Resolve the bearer token for API requests. Uses the access token when provided,
 * otherwise falls back to the legacy email + API key OAuth exchange.
 *
 * @since 1.1.0
 * @param {object} cfg - action configuration from getInputs()
 * @return {Promise<string>} The bearer token.
 */
async function resolveToken(cfg) {
  if (cfg.apiToken) {
    console.log('[API] Using Cloudways API access token');
    return cfg.apiToken;
  }

  console.warn(
    '⚠️ [API] CLOUDWAYS_EMAIL + CLOUDWAYS_API_KEY is deprecated and stops working on October 15, 2026. '
      + 'Switch to CLOUDWAYS_API_TOKEN.'
  );
  return getAccessToken({ email: cfg.email, apiKey: cfg.apiKey, apiUrl: cfg.apiUrl });
}

module.exports = {
  getAccessToken,
  resolveToken
};

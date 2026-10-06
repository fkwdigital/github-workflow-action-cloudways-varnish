const DEFAULT_API_URL = 'https://api.cloudways.com/api/v1';

const STATUS_HINTS = {
  401: 'token is invalid, expired or revoked',
  403: 'token lacks the required permission'
};

/**
 * Send a JSON request to the Cloudways API and return the parsed response.
 *
 * @since 1.1.0
 * @param {object} opts
 * @param {string} [opts.apiUrl] - API base URL
 * @param {string} [opts.token]  - bearer token, omitted for unauthenticated calls
 * @param {string} opts.method   - HTTP method
 * @param {string} opts.path     - endpoint path, starting with /
 * @param {object} [opts.body]   - JSON body
 * @returns {Promise<object>} The parsed JSON response.
 */
async function request({ apiUrl = DEFAULT_API_URL, token = '', method, path, body }) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { raw: text };
  }

  if (!response.ok) {
    const hint = STATUS_HINTS[response.status] ? ` (${STATUS_HINTS[response.status]})` : '';
    throw new Error(`Cloudways API ${method} ${path} failed: HTTP ${response.status}${hint} ${text}`);
  }

  return data;
}

module.exports = {
  request,
  DEFAULT_API_URL
};

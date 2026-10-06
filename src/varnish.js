const { request } = require('./client');

/**
 * Run a Varnish service action (enable, disable or purge) on a Cloudways server.
 *
 * @since 1.0.0
 * @param {object} opts
 * @param {string} opts.token          - bearer token
 * @param {string|number} opts.serverId - Cloudways server id
 * @param {string} opts.action         - enable, disable or purge
 * @param {string} [opts.apiUrl]       - API base URL
 * @return {Promise<object>} Object with `completed: true` on success.
 */
async function executeVarnishAction({ token, serverId, action, apiUrl }) {
  console.log(`[API] Executing Varnish ${action} on server ${serverId}...`);

  const data = await request({
    apiUrl,
    token,
    method: 'POST',
    path: '/service/varnish',
    body: { server_id: parseInt(serverId, 10), action }
  });

  console.log('[API] Response:', JSON.stringify(data));

  if (data.status === false) {
    throw new Error(`Operation failed: ${data.message || 'Unknown error'}`);
  }

  // varnish actions return {status: true} and complete immediately
  if (data.status === true) {
    console.log(`✅ [API] Varnish ${action} completed successfully`);
    return { completed: true };
  }

  throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
}

module.exports = {
  executeVarnishAction
};

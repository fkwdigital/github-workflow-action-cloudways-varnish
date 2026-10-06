const API_BASE = 'https://api.cloudways.com/api/v1';

/**
 * Obtains an OAuth access token for the Cloudways API.
 *
 * @param {string} email The email address associated with the Cloudways account.
 * @param {string} apiKey The API key associated with the Cloudways account.
 * @return {Promise<string>} A promise that resolves with the obtained access token.
 */
async function getAccessToken(email, apiKey) {
  console.log('[API] Obtaining OAuth access token...');

  const response = await fetch(`${API_BASE}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, api_key: apiKey })
  });

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(`Failed to obtain access token: ${JSON.stringify(data)}`);
  }

  console.log('✅ [API] Access token obtained');
  return data.access_token;
}

/**
 * Resolves the bearer token for API requests. Uses the access token when provided,
 * otherwise falls back to the legacy email + API key OAuth exchange.
 *
 * @since 1.1.0
 * @param {object} cfg The action configuration from getInputs().
 * @return {Promise<string>} A promise that resolves with the bearer token.
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
  return getAccessToken(cfg.email, cfg.apiKey);
}

/**
 * Executes a Varnish action (such as 'flush_all' or 'list_backends') on a
 * specified Cloudways server.
 *
 * @param {string} token The OAuth access token to authenticate the request.
 * @param {string} serverId The integer ID of the Cloudways server to target.
 * @param {string} action The Varnish action to execute (e.g. 'flush_all', 'list_backends').
 * @return {Promise<object>} A promise that resolves with an object containing
 *   a single property `completed` set to `true` if the operation completed successfully.
 * @throws {Error} If the operation fails or the response format is unexpected.
 */
async function executeVarnishAction(token, serverId, action) {
  const endpoint = `${API_BASE}/service/varnish`;

  // build the payload for api request
  const serverIdInt = parseInt(serverId, 10);
  const payload = {
    server_id: serverIdInt,
    action
  };

  console.log(`[API] Executing Varnish ${action} on server ${serverId}...`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 401 || response.status === 403) {
    const hint = response.status === 401
      ? 'token is invalid, expired or revoked'
      : 'token lacks the required permission';
    throw new Error(`HTTP ${response.status} (${hint}): ${await response.text()}`);
  }

  const data = await response.json();

  console.log('[API] Response:', JSON.stringify(data));

  // check if the operation failed
  if (data.status === false) {
    const errorMsg = data.message || 'Unknown error';
    throw new Error(`Operation failed: ${errorMsg}`);
  }

  // Varnish operations return {status: true} and complete immediately
  if (data.status === true) {
    console.log(`✅ [API] Varnish ${action} completed successfully`);
    return { completed: true };
  }

  // if we get here, unexpected response format
  throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
}

/**
 * Retrieves the status of a previously-executed Cloudways operation.
 *
 * @param {string} token The OAuth access token to authenticate the request.
 * @param {string} operationId The ID of the operation to retrieve the status for.
 * @return {Promise<object>} A promise that resolves with an object containing the
 *   operation status. The object will have a single property `operation` containing
 *   an object with properties `is_completed` (a boolean indicating whether the
 *   operation has completed) and optionally `message` (a string describing any errors
 *   that occurred during the operation).
 * @throws {Error} If the operation fails or the response format is unexpected.
 */
async function checkOperationStatus(token, operationId) {
  const response = await fetch(`${API_BASE}/operation/${operationId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.json();
}

/**
 * Returns a promise that resolves after the specified number of milliseconds.
 * @param {number} ms The number of milliseconds to wait.
 * @return {Promise<void>} A promise that resolves after the specified number of milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Retrieves the status of a previously-executed Cloudways operation and waits until
 * the operation has completed successfully.
 *
 * The function will make up to `maxAttempts` requests to the Cloudways API at
 * intervals of `interval` milliseconds. If the operation has not completed
 * successfully after `maxAttempts` requests, the function will throw an error.
 *
 * @param {string} token The OAuth access token to authenticate the request.
 * @param {string} operationId The ID of the operation to retrieve the status for.
 * @param {number} attempt The current attempt number
 *    (will be incremented by 1 on each recursive call).
 * @param {number} maxAttempts The maximum number of attempts to make to the Cloudways API.
 * @param {number} interval The interval (in milliseconds) between each request
 *    to the Cloudways API.
 * @return {Promise<object>} A promise that resolves with an object containing the
 *   operation status. The object will have a single property `operation` containing
 *   an object with properties `is_completed` (a boolean indicating whether the
 *   operation has completed) and optionally `message` (a string describing any errors
 *   that occurred during the operation).
 * @throws {Error} If the operation fails or the response format is unexpected.
 */
async function checkOperationUntilComplete(token, operationId, attempt, maxAttempts, interval) {
  if (attempt > maxAttempts) {
    console.log('');
    const errorMsg = `Operation timed out after ${maxAttempts} attempts (ID: ${operationId})`;
    throw new Error(errorMsg);
  }

  await sleep(interval);

  const status = await checkOperationStatus(token, operationId);

  if (status.operation) {
    if (status.operation.is_completed) {
      console.log('✅ [API] Operation completed successfully');
      return status.operation;
    }
  }

  process.stdout.write('.');

  return checkOperationUntilComplete(token, operationId, attempt + 1, maxAttempts, interval);
}

/**
 * Waits for an operation to complete by polling the Cloudways API at
 * intervals of `interval` milliseconds until the operation has completed
 * successfully or the maximum number of attempts (`maxAttempts`) has been
 * reached.
 *
 * @param {string} token The OAuth access token to authenticate the request.
 * @param {string} operationId The ID of the operation to retrieve the status for.
 * @param {number} [maxAttempts=30] The maximum number of attempts to make to the Cloudways API.
 * @param {number} [interval=5000] The interval (in milliseconds) between each request
 *    to the Cloudways API.
 * @return {Promise<object>} A promise that resolves with an object containing the
 *   operation status.
 */
async function waitForCompletion(token, operationId, maxAttempts, interval) {
  const maxWait = maxAttempts || 30;
  const waitInterval = interval || 5000;

  console.log('[API] Waiting for operation to complete...');

  return checkOperationUntilComplete(token, operationId, 1, maxWait, waitInterval);
}

module.exports = {
  getAccessToken,
  resolveToken,
  executeVarnishAction,
  checkOperationStatus,
  waitForCompletion
};

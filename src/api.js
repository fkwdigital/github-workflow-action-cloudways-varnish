const API_BASE = 'https://api.cloudways.com/api/v1';

/**
 * Obtains an OAuth access token.
 *
 * @param {string} email - User email to authenticate with.
 * @param {string} apiKey - API key to authenticate with.
 * @returns {Promise<string>} - A promise resolving to the access token string.
 * @throws {Error} - If the access token could not be obtained, an error is thrown.
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
 * Executes a Varnish action on a specified server.
 *
 * @param {string} token - An OAuth access token.
 * @param {string} serverId - The ID of the server to execute the action on.
 * @param {string} action - The Varnish action to execute (e.g. "ban", "unban", "flushall").
 * @returns {Promise<Object>} - A promise resolving to the initiated operation object.
 * @throws {Error} - If the operation could not be initiated, an error is thrown.
 */
async function executeVarnishAction(token, serverId, action) {
  const endpoint = `${API_BASE}/service/varnish`;

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

  const data = await response.json();

  if (!data.operation) {
    throw new Error(`Operation failed: ${JSON.stringify(data)}`);
  }

  if (!data.operation.id) {
    throw new Error(`Operation failed: ${JSON.stringify(data)}`);
  }

  console.log(`✅ [API] Operation initiated (ID: ${data.operation.id})`);
  return data.operation;
}

/**
 * Checks the status of a Varnish operation.
 *
 * @param {string} token - An OAuth access token.
 * @param {string} operationId - The ID of the operation to check the status of.
 * @returns {Promise<Object>} - A promise resolving to the operation status object.
 * @throws {Error} - If the operation status could not be obtained, an error is thrown.
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
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} - A promise that resolves after the specified number of milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Checks the status of a Varnish operation until it is completed.
 *
 * If the operation does not complete within the specified maximum number of attempts,
 * an error is thrown.
 *
 * @param {string} token - An OAuth access token.
 * @param {string} operationId - The ID of the operation to check the status of.
 * @param {number} attempt - The current attempt number.
 * @param {number} maxAttempts - The maximum number of attempts to check the operation status.
 * @param {number} interval - The interval in milliseconds to wait between attempts.
 * @returns {Promise<Object>} - A promise resolving to the operation status object.
 * @throws {Error} - If the maximum number of attempts is exceeded, an error is thrown.
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
 * Waits for a Varnish operation to complete.
 *
 * @param {string} token - An OAuth access token.
 * @param {string} operationId - The ID of the operation to check the status of.
 * @param {number} [maxAttempts=30] - The maximum number of attempts to check the operation status.
 * @param {number} [interval=5000] - The interval in milliseconds to wait between attempts.
 * @returns {Promise<Object>} - A promise resolving to the operation status object.
 * @throws {Error} - If the maximum number of attempts is exceeded, an error is thrown.
 */
async function waitForCompletion(token, operationId, maxAttempts, interval) {
  const maxWait = maxAttempts || 30;
  const waitInterval = interval || 5000;

  console.log('[API] Waiting for operation to complete...');

  return checkOperationUntilComplete(token, operationId, 1, maxWait, waitInterval);
}

module.exports = {
  getAccessToken,
  executeVarnishAction,
  checkOperationStatus,
  waitForCompletion
};

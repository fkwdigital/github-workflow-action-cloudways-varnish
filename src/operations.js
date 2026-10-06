const { request } = require('./client');

const DEFAULT_MAX_ATTEMPTS = 30;
const DEFAULT_INTERVAL_MS = 5000;

/**
 * Wait for the given number of milliseconds.
 *
 * @since 1.0.0
 * @param {number} ms - milliseconds to wait
 * @return {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Get the status of a Cloudways background operation.
 *
 * @since 1.0.0
 * @param {object} opts
 * @param {string} opts.token          - bearer token
 * @param {string|number} opts.id      - operation id
 * @param {string} [opts.apiUrl]       - API base URL
 * @return {Promise<object>} The API response containing `operation`.
 */
function checkOperationStatus({ token, id, apiUrl }) {
  return request({ apiUrl, token, method: 'GET', path: `/operation/${id}` });
}

/**
 * Poll a Cloudways background operation until it completes or the attempts run out.
 *
 * @since 1.0.0
 * @param {object} opts
 * @param {string} opts.token          - bearer token
 * @param {string|number} opts.id      - operation id
 * @param {string} [opts.apiUrl]       - API base URL
 * @param {number} [opts.maxAttempts]  - max number of polls
 * @param {number} [opts.intervalMs]   - delay between polls
 * @return {Promise<object>} The completed operation object.
 */
async function waitForCompletion({
  token,
  id,
  apiUrl,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  intervalMs = DEFAULT_INTERVAL_MS
}) {
  console.log('[API] Waiting for operation to complete...');

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(intervalMs);
    // eslint-disable-next-line no-await-in-loop
    const { operation } = await checkOperationStatus({ token, id, apiUrl });

    if (operation && (String(operation.is_completed) === '1' || operation.is_completed === true)) {
      if (String(operation.status) === '-1') {
        throw new Error(`Operation ${id} failed: ${operation.message || 'no message'}`);
      }
      console.log('✅ [API] Operation completed successfully');
      return operation;
    }
  }

  throw new Error(`Operation timed out after ${maxAttempts} attempts (ID: ${id})`);
}

module.exports = {
  checkOperationStatus,
  waitForCompletion
};

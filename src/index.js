const { getInputs, assertRequired } = require('./inputs');
const { getAccessToken, executeVarnishAction, waitForCompletion } = require('./api');

/**
 * Main entry point for the GitHub Actions workflow.
 *
 * Retrieves the inputs required for the Varnish action, asserts
 * that the required inputs are present, and then executes the
 * Varnish action using the provided inputs.
 *
 * If waitForCompletion is true, waits for the operation to complete
 * before exiting.
 *
 * If an error occurs during execution, logs the error message
 * and exits with a non-zero status code.
 */
async function main() {
  try {
    const cfg = getInputs();
    assertRequired(cfg);

    console.log(`[Varnish] Action: ${cfg.action}`);
    console.log(`[Varnish] Server ID: ${cfg.serverId}`);
    console.log(`[Varnish] Wait for completion: ${cfg.waitForCompletion}`);

    // obtain access token
    const token = await getAccessToken(cfg.email, cfg.apiKey);

    // execute varnish service action
    const operation = await executeVarnishAction(token, cfg.serverId, cfg.action);

    // optional, wait for service action process to complete instead of async
    if (cfg.waitForCompletion) {
      await waitForCompletion(token, operation.id);
      console.log('✅ [Varnish] Operation completed successfully');
    } else {
      console.log(`✅ [Varnish] Operation initiated (ID: ${operation.id})`);
      console.log('   Use the operation ID to check status later');
    }

    process.exit(0);
  } catch (error) {
    console.error('⚠️ [Varnish] Error:', error.message);
    process.exit(1);
  }
}

main();

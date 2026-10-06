const { getInputs, assertRequired } = require('./inputs');
const { resolveToken, executeVarnishAction } = require('./api');

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

    // use access token, or exchange legacy email + api key for one
    const token = await resolveToken(cfg);

    // execute varnish service action
    const operation = await executeVarnishAction(token, cfg.serverId, cfg.action);

    // optional, wait for service action process to complete instead of async
    if (operation.completed) {
      console.log('✅ [Varnish] Operation completed successfully');
    }

    process.exit(0);
  } catch (error) {
    console.error('⚠️ [Varnish] Error:', error.message);
    process.exit(1);
  }
}

main();

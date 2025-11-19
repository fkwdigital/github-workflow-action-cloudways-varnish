const { getInputs, assertRequired } = require('./inputs');
const { getAccessToken, executeVarnishAction, waitForCompletion } = require('./api');

async function main() {
  try {
    const cfg = getInputs();
    assertRequired(cfg);

    console.log(`[Varnish] Action: ${cfg.action}`);
    console.log(`[Varnish] Server ID: ${cfg.serverId}`);
    console.log(`[Varnish] Wait for completion: ${cfg.waitForCompletion}`);

    // Get OAuth token
    const token = await getAccessToken(cfg.email, cfg.apiKey);

    // Execute the Varnish action
    const operation = await executeVarnishAction(token, cfg.serverId, cfg.action);

    // Wait for completion if requested
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

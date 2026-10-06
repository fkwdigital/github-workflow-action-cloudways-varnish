const { getInputs, assertRequired } = require('./inputs');
const { resolveToken } = require('./auth');
const { executeVarnishAction } = require('./varnish');

/**
 * Resolve credentials and run the requested Varnish action.
 *
 * @since 1.0.0
 * @return {Promise<void>}
 */
async function main() {
  const cfg = getInputs();
  assertRequired(cfg);

  console.log(`[Varnish] Action: ${cfg.action}`);
  console.log(`[Varnish] Server ID: ${cfg.serverId}`);

  // use access token, or exchange legacy email + api key for one
  const token = await resolveToken(cfg);

  const operation = await executeVarnishAction({
    token,
    serverId: cfg.serverId,
    action: cfg.action,
    apiUrl: cfg.apiUrl
  });

  if (operation.completed) {
    console.log('✅ [Varnish] Operation completed successfully');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('⚠️ [Varnish] Error:', error.message);
    process.exit(1);
  });

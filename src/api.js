const API_BASE = 'https://api.cloudways.com/api/v1';

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

async function executeVarnishAction(token, serverId, action) {
  const endpoint =
    action === 'purge' ? `${API_BASE}/service/varnish_purge` : `${API_BASE}/service/state`;

  const payload =
    action === 'purge'
      ? { server_id: parseInt(serverId, 10) }
      : {
          server_id: parseInt(serverId, 10),
          service: 'varnish',
          state: action === 'enable' ? 'start' : 'stop'
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

  if (!data.operation || !data.operation.id) {
    throw new Error(`Operation failed: ${JSON.stringify(data)}`);
  }

  console.log(`✅ [API] Operation initiated (ID: ${data.operation.id})`);
  return data.operation;
}

async function checkOperationStatus(token, operationId) {
  const response = await fetch(`${API_BASE}/operation/${operationId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.json();
}

async function waitForCompletion(token, operationId, maxAttempts = 30, interval = 5000) {
  console.log('[API] Waiting for operation to complete...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, interval));

    const status = await checkOperationStatus(token, operationId);

    if (status.operation && status.operation.is_completed) {
      console.log('✅ [API] Operation completed successfully');
      return status.operation;
    }

    process.stdout.write('.');
  }

  console.log('');
  throw new Error(`Operation timed out after ${maxAttempts} attempts (ID: ${operationId})`);
}

module.exports = {
  getAccessToken,
  executeVarnishAction,
  checkOperationStatus,
  waitForCompletion
};

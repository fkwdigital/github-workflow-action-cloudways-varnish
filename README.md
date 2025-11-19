# Cloudways Varnish Manager

A GitHub Action to manage Varnish cache service on Cloudways servers - enable, disable, or purge the cache directly from your CI/CD workflows.

## Features

- **Enable Varnish**: Start the Varnish service on your server
- **Disable Varnish**: Stop the Varnish service on your server
- **Purge Cache**: Clear the Varnish cache without restarting the service
- **Async Operation Tracking**: Optionally wait for operations to complete
- **Clean Architecture**: Separated concerns with dedicated modules

## Usage

### Basic Example

```yaml
- name: Purge Varnish Cache
  uses: fkwdigital/github-workflow-action-cloudways-varnish@v1
  with:
    CLOUDWAYS_EMAIL: ${{ secrets.CLOUDWAYS_EMAIL }}
    CLOUDWAYS_API_KEY: ${{ secrets.CLOUDWAYS_API_KEY }}
    CLOUDWAYS_SERVER_ID: '12345'
    ACTION: 'purge'
```

### Enable Varnish

```yaml
- name: Enable Varnish
  uses: fkwdigital/github-workflow-action-cloudways-varnish@v1
  with:
    CLOUDWAYS_EMAIL: ${{ secrets.CLOUDWAYS_EMAIL }}
    CLOUDWAYS_API_KEY: ${{ secrets.CLOUDWAYS_API_KEY }}
    CLOUDWAYS_SERVER_ID: '12345'
    ACTION: 'enable'
    WAIT_FOR_COMPLETION: 'true'
```

### Disable Varnish

```yaml
- name: Disable Varnish on Dev Server
  uses: fkwdigital/github-workflow-action-cloudways-varnish@v1
  with:
    CLOUDWAYS_EMAIL: ${{ secrets.CLOUDWAYS_EMAIL }}
    CLOUDWAYS_API_KEY: ${{ secrets.CLOUDWAYS_API_KEY }}
    CLOUDWAYS_SERVER_ID: '12345'
    ACTION: 'disable'
```

## Inputs

| Input                 | Description                                        | Required | Default |
| --------------------- | -------------------------------------------------- | -------- | ------- |
| `CLOUDWAYS_EMAIL`     | Your Cloudways account email                       | Yes      | -       |
| `CLOUDWAYS_API_KEY`   | Your Cloudways API key                             | Yes      | -       |
| `SERVER_ID`           | The Cloudways server ID                            | Yes      | -       |
| `ACTION`              | Action to perform: `enable`, `disable`, or `purge` | Yes      | `purge` |
| `WAIT_FOR_COMPLETION` | Wait for the operation to complete                 | No       | `true`  |

## Getting Your Credentials

### Cloudways API Key

1. Log in to [Cloudways Platform](https://platform.cloudways.com)
2. Go to: https://platform.cloudways.com/api
3. Click "Regenerate Key"
4. Copy and store securely

### Server ID

1. Go to "Servers" in Cloudways Platform
2. Click your server
3. Find the ID in the URL: `https://platform.cloudways.com/server/{SERVER_ID}/...`

## Secrets Setup

Add these to your GitHub repository secrets:

1. Repository Settings → Secrets and variables → Actions
2. Add secrets:
   - `CLOUDWAYS_EMAIL`
   - `CLOUDWAYS_API_KEY`

## Common Workflows

### Deploy and Purge Cache

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Server
        run: |
          # Your deployment commands

      - name: Purge Varnish Cache
        uses: fkwdigital/github-workflow-action-cloudways-varnish@v1
        with:
          CLOUDWAYS_EMAIL: ${{ secrets.CLOUDWAYS_EMAIL }}
          CLOUDWAYS_API_KEY: ${{ secrets.CLOUDWAYS_API_KEY }}
          CLOUDWAYS_SERVER_ID: ${{ secrets.PRODUCTION_SERVER_ID }}
          ACTION: 'purge'
```

### Multi-Server Cache Purge

```yaml
name: Purge All Servers
on:
  workflow_dispatch:

jobs:
  purge:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        server_id: ['12345', '67890']
    steps:
      - name: Purge Cache
        uses: fkwdigital/github-workflow-action-cloudways-varnish@v1
        with:
          CLOUDWAYS_EMAIL: ${{ secrets.CLOUDWAYS_EMAIL }}
          CLOUDWAYS_API_KEY: ${{ secrets.CLOUDWAYS_API_KEY }}
          CLOUDWAYS_SERVER_ID: ${{ matrix.server_id }}
          ACTION: 'purge'
```

## About Varnish on Cloudways

Varnish is a high-performance HTTP accelerator pre-installed on all Cloudways servers. It:

- Caches frequently accessed content in memory
- Reduces server load significantly
- Improves page load times
- Handles high traffic volumes

**Note**: Keep Varnish enabled on production. Disable only for development/testing.

## Contributing

Contributions welcome! Please submit a Pull Request.

## License

MIT License

## Support

- **Action Issues**: Open an issue on this repository
- **Cloudways API**: [Cloudways Support](https://support.cloudways.com)
- **Documentation**: [Cloudways API Docs](https://developers.cloudways.com/docs/)

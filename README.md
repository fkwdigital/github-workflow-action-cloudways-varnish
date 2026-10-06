# Cloudways Varnish Manager

A GitHub Action to manage Varnish cache service on Cloudways servers - enable, disable, or purge the cache directly from your CI/CD workflows.

## Features

- **Enable Varnish**: Start the Varnish service on your server
- **Disable Varnish**: Stop the Varnish service on your server
- **Purge Cache**: Clear the Varnish cache without restarting the service

## Usage

### Basic Example

```yaml
- name: Purge Varnish Cache
  uses: fkwdigital/github-workflow-action-cloudways-varnish@v1
  with:
    CLOUDWAYS_API_TOKEN: ${{ secrets.CLOUDWAYS_API_TOKEN }}
    CLOUDWAYS_SERVER_ID: '12345'
    ACTION: 'purge'
```

### Enable Varnish

```yaml
- name: Enable Varnish
  uses: fkwdigital/github-workflow-action-cloudways-varnish@v1
  with:
    CLOUDWAYS_API_TOKEN: ${{ secrets.CLOUDWAYS_API_TOKEN }}
    CLOUDWAYS_SERVER_ID: '12345'
    ACTION: 'enable'
```

### Disable Varnish

```yaml
- name: Disable Varnish on Dev Server
  uses: fkwdigital/github-workflow-action-cloudways-varnish@v1
  with:
    CLOUDWAYS_API_TOKEN: ${{ secrets.CLOUDWAYS_API_TOKEN }}
    CLOUDWAYS_SERVER_ID: '12345'
    ACTION: 'disable'
```

## Inputs

| Input                 | Description                                                      | Required | Default |
| --------------------- | ---------------------------------------------------------------- | -------- | ------- |
| `CLOUDWAYS_API_TOKEN` | Cloudways API access token                                       | Yes\*    | -       |
| `CLOUDWAYS_EMAIL`     | (Deprecated) Cloudways account email, used with the legacy key   | No       | -       |
| `CLOUDWAYS_API_KEY`   | (Deprecated) Cloudways legacy API key                            | No       | -       |
| `CLOUDWAYS_SERVER_ID` | The Cloudways server ID                                          | Yes      | -       |
| `ACTION`              | Action to perform: `enable`, `disable`, or `purge`               | Yes      | `purge` |

\* Provide `CLOUDWAYS_API_TOKEN`, or both `CLOUDWAYS_EMAIL` and `CLOUDWAYS_API_KEY`. If the token is set, it is used
and the email and key are ignored.

## Getting Your Credentials

### Cloudways API Access Token

Only the primary Cloudways account owner can create access tokens. Team member accounts do not see the
**API Integration** menu.

1. Log in to the [Cloudways Platform](https://platform.cloudways.com). From the profile dropdown (top right), click
   **API Integration**.
2. In the **Access Token Details** section, click **Create Access Token**.
3. **Access Token Name**: use a name that identifies the repository, e.g. `GitHub Varnish - mysite`.
4. **Expiration**: choose `1 day`, `1 month`, `3 months`, `6 months`, `1 year` or `Never`. Pick the shortest period
   you are willing to rotate on. When the token expires, the action fails with HTTP 401 until you update the
   secret.
5. **Scope**: choose **Limited Access**, expand the category and select only this endpoint:

| Endpoint                | Category | Purpose                                         |
| ----------------------- | -------- | ----------------------------------------------- |
| `POST /service/varnish` | Services | Enable, disable or purge Varnish on the server  |

   Do not choose **Read-Only Access**, because it only covers `GET` requests and cannot change Varnish. Do not choose
   **Full Access**, because it grants far more than this action needs.
6. Click **Create Access Token** and copy the token right away. Cloudways shows it **only once**. It cannot be viewed
   or regenerated later; if you lose it, revoke it and create a new one.

To check the permissions later, open the token's three-dot menu in **Access Token Details** and choose
**View Scopes**. To stop the token working immediately, choose **Revoke**.

If you also use [github-workflow-action-cloudways-application-wordpress](https://github.com/fkwdigital/github-workflow-action-cloudways-application-wordpress)
with permission resets, create a separate token for each action so each has only the access it needs.

### Legacy API Key (Deprecated)

Cloudways retires the legacy API key on **October 15, 2026**. After that date, `CLOUDWAYS_EMAIL` +
`CLOUDWAYS_API_KEY` stops working and this action will fail. Until then it still works, and the action logs a
deprecation warning. To migrate, create an access token as above, add it as the `CLOUDWAYS_API_TOKEN` secret, replace
the two inputs in your workflow, and then delete the `CLOUDWAYS_EMAIL` and `CLOUDWAYS_API_KEY` secrets.

### Troubleshooting

- **HTTP 401**: token is wrong, expired or revoked, or the secret name is misspelled.
- **HTTP 403**: token is missing the `POST /service/varnish` permission. Check it with **View Scopes**.

### Server ID

1. Go to "Servers" in Cloudways Platform
2. Click your server
3. Find the ID in the URL: `https://platform.cloudways.com/server/{SERVER_ID}/...`

## Secrets Setup

Add these to your GitHub repository secrets:

1. Repository Settings → Secrets and variables → Actions
2. Add secret:
   - `CLOUDWAYS_API_TOKEN`

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
      - uses: actions/checkout@v7

      - name: Deploy to Server
        run: |
          # Your deployment commands

      - name: Purge Varnish Cache
        uses: fkwdigital/github-workflow-action-cloudways-varnish@v1
        with:
          CLOUDWAYS_API_TOKEN: ${{ secrets.CLOUDWAYS_API_TOKEN }}
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
          CLOUDWAYS_API_TOKEN: ${{ secrets.CLOUDWAYS_API_TOKEN }}
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

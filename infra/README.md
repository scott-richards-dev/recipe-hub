# Infrastructure as Code

This directory contains Bicep templates for deploying the Recipe Hub application to Azure.

## Resources

The infrastructure creates the following Azure resources:

- **App Service Plan** (B1 Basic tier, Linux)
- **Web App** (Node.js 20 LTS)
  - Managed Identity enabled
  - HTTPS only
  - Minimum TLS 1.2

## Environment Variables

The following environment variables are configured in the Web App:

### Non-sensitive configuration
- `NODE_ENV` - Environment name (dev, staging, prod)
- `PORT` - Port for the application (8080)
- `WEBSITE_NODE_DEFAULT_VERSION` - Node.js version
- `SCM_DO_BUILD_DURING_DEPLOYMENT` - Enable build during deployment

### Secrets (from Azure Key Vault)
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Firebase service account email
- `FIREBASE_PRIVATE_KEY` - Firebase service account private key

## Prerequisites

Before deploying, ensure you have:

1. An Azure subscription
2. An Azure Key Vault with the following secrets:
   - `firebase-project-id`
   - `firebase-client-email`
   - `firebase-private-key`
3. GitHub secrets configured:
   - `AZURE_CLIENT_ID` - Service Principal client ID
   - `AZURE_TENANT_ID` - Azure tenant ID
   - `AZURE_SUBSCRIPTION_ID` - Azure subscription ID
   - `AZURE_RESOURCE_GROUP` - Resource group name
   - `AZURE_LOCATION` - Azure region (e.g., eastus)
   - `AZURE_KEYVAULT_NAME` - Key Vault name

## Deployment

### Via GitHub Actions

The infrastructure can be deployed automatically using GitHub Actions:

1. Push changes to the `infra/` directory
2. Or manually trigger the "Deploy Infrastructure" workflow

### Manual Deployment

```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name rg-recipe-hub-dev --location eastus

# Deploy using Bicep
az deployment group create \
  --resource-group rg-recipe-hub-dev \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam

# Or deploy with inline parameters
az deployment group create \
  --resource-group rg-recipe-hub-dev \
  --template-file infra/main.bicep \
  --parameters environmentName=dev keyVaultName=kv-recipe-hub-dev
```

## Key Vault Setup

Create secrets in Azure Key Vault from your `serviceAccountKey.json`:

```bash
# Extract values from serviceAccountKey.json
PROJECT_ID=$(jq -r '.project_id' serviceAccountKey.json)
CLIENT_EMAIL=$(jq -r '.client_email' serviceAccountKey.json)
PRIVATE_KEY=$(jq -r '.private_key' serviceAccountKey.json)

# Create secrets in Key Vault
az keyvault secret set --vault-name kv-recipe-hub-dev --name firebase-project-id --value "$PROJECT_ID"
az keyvault secret set --vault-name kv-recipe-hub-dev --name firebase-client-email --value "$CLIENT_EMAIL"
az keyvault secret set --vault-name kv-recipe-hub-dev --name firebase-private-key --value "$PRIVATE_KEY"
```

## Outputs

The deployment provides the following outputs:

- `webAppName` - Name of the deployed Web App
- `webAppHostname` - Default hostname
- `webAppUrl` - Full HTTPS URL
- `webAppPrincipalId` - Managed Identity principal ID

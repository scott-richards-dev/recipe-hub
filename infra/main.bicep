@description('The name of the environment (e.g., dev, staging, prod)')
param environmentName string

@description('The location for all resources')
param location string = resourceGroup().location

@description('The name of the App Service Plan')
param appServicePlanName string = 'asp-recipe-hub-${environmentName}'

@description('The name of the Web App')
param webAppName string = 'app-recipe-hub-${environmentName}'

@description('The SKU for the App Service Plan')
param appServicePlanSku object = {
  name: 'F1'
  tier: 'Free'
  capacity: 1
}

@description('The Key Vault name containing secrets')
param keyVaultName string

@description('Node.js version for the runtime stack')
param nodeVersion string = '20-lts'

// Reference to existing Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: appServicePlanSku.name
    tier: appServicePlanSku.tier
    capacity: appServicePlanSku.capacity
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
  tags: {
    environment: environmentName
    application: 'recipe-hub'
  }
}

// Web App
resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|${nodeVersion}'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      appSettings: [
        {
          name: 'NODE_ENV'
          value: environmentName
        }
        {
          name: 'PORT'
          value: '8080'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        // Firebase configuration - pull from Key Vault
        {
          name: 'FIREBASE_PROJECT_ID'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=firebase-project-id)'
        }
        {
          name: 'FIREBASE_CLIENT_EMAIL'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=firebase-client-email)'
        }
        {
          name: 'FIREBASE_PRIVATE_KEY'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=firebase-private-key)'
        }
      ]
    }
  }
  tags: {
    environment: environmentName
    application: 'recipe-hub'
  }
}

// Grant Web App access to Key Vault using RBAC
resource keyVaultSecretUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, webApp.id, 'Key Vault Secrets User')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

@description('The name of the deployed Web App')
output webAppName string = webApp.name

@description('The default hostname of the Web App')
output webAppHostname string = webApp.properties.defaultHostName

@description('The URL of the Web App')
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'

@description('The principal ID of the Web App managed identity')
output webAppPrincipalId string = webApp.identity.principalId

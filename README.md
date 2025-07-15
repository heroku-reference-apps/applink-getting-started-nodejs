# Heroku AppLink Node.js App Template

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://www.heroku.com/deploy?template=https://github.com/heroku-reference-apps/applink-getting-started-nodejs)

The Heroku AppLink Node.js app template is a [Fastify](https://fastify.dev/) web application that demonstrates how to build APIs for Salesforce integration using Heroku AppLink. This template includes authentication, authorization, and API specifications for seamless integration with Salesforce, Data Cloud, and Agentforce.

## Table of Contents

- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [Testing with invoke.sh](#testing-with-invokesh)
- [Manual Heroku Deployment](#manual-heroku-deployment)
- [Heroku AppLink Setup](#heroku-applink-setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Additional Resources](#additional-resources)

## Quick Start

### Prerequisites

- Node.js 20.x or later
- npm
- Git
- Heroku CLI (for deployment)
- Salesforce org (for AppLink integration)

### Deploy to Heroku (One-Click)

Click the Deploy button above to deploy this app directly to Heroku with the AppLink add-on pre-configured.

## Local Development

### 1. Clone and Install

```bash
git clone https://github.com/heroku-reference-apps/applink-getting-started-nodejs.git
cd applink-getting-started-nodejs
npm install
```

### 2. Start the Development Server

```bash
# Start with auto-reload and debug logging
npm run dev

# Or start production mode
npm start
```

Your app will be available at `http://localhost:3000`

### 3. API Endpoints

- **GET /accounts** - Retrieve Salesforce accounts from the invoking org
- **POST /unitofwork** - Create a unit of work for Salesforce
- **POST /handleDataCloudDataChangeEvent** - Handle a Salesforce Data Cloud Change Event
- **GET /api-docs** - Interactive Swagger UI for API documentation
- **GET /health** - Health check endpoint

### 4. View API Documentation

Visit `http://localhost:3000/api-docs` to explore the interactive API documentation powered by Swagger UI.

## Testing locallywith invoke.sh

The `bin/invoke.sh` script allows you to test your locally running app with proper Salesforce client context headers.

### Usage

```bash
./bin/invoke.sh ORG_DOMAIN ACCESS_TOKEN ORG_ID USER_ID [METHOD] [API_PATH] [DATA]
```

### Parameters

- **ORG_DOMAIN**: Your Salesforce org domain (e.g., `mycompany.my.salesforce.com`)
- **ACCESS_TOKEN**: Valid Salesforce access token
- **ORG_ID**: Salesforce organization ID (15 or 18 characters)
- **USER_ID**: Salesforce user ID (15 or 18 characters)
- **METHOD**: HTTP method (default: GET)
- **API_PATH**: API endpoint path (default: /accounts)
- **DATA**: JSON data for POST/PUT requests

### Examples

```bash
# Test the accounts endpoint
./bin/invoke.sh mycompany.my.salesforce.com TOKEN_123 00D123456789ABC 005123456789ABC

# Test with POST data
./bin/invoke.sh mycompany.my.salesforce.com TOKEN_123 00D123456789ABC 005123456789ABC POST /accounts '--data "{\"name\":\"Test Account\"}"'

# Test custom endpoint
./bin/invoke.sh mycompany.my.salesforce.com TOKEN_123 00D123456789ABC 005123456789ABC GET /health
```

### Getting Salesforce Credentials

To get the required Salesforce credentials for testing:

1. **Access Token**: Use Salesforce CLI to generate a session token
2. **Org ID**: Found in Setup → Company Information
3. **User ID**: Found in your user profile or Setup → Users

## Manual Heroku Deployment

### 1. Prerequisites

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- Git repository initialized
- Heroku account with billing enabled (for add-ons)

### 2. Create Heroku App

```bash
# Create a new Heroku app
heroku create your-app-name

# Or let Heroku generate a name
heroku create
```

### 3. Add Required Buildpacks

The app requires two buildpacks in the correct order:

```bash
# Add the AppLink Service Mesh buildpack first
heroku buildpacks:add heroku/heroku-applink-service-mesh

# Add the Node.js buildpack second
heroku buildpacks:add heroku/nodejs
```

### 4. Provision the AppLink Add-on

```bash
# Provision the Heroku AppLink add-on
heroku addons:create heroku-applink

# Set the required HEROKU_APP_ID config var
heroku config:set HEROKU_APP_ID="$(heroku apps:info --json | jq -r '.app.id')"
```

### 5. Deploy the Application

```bash
# Deploy to Heroku
git push heroku main

# Check deployment status
heroku ps:scale web=1
heroku open
```

### 6. Verify Deployment

```bash
# Check app logs
heroku logs --tail
```

## Heroku AppLink Setup

### 1. Install AppLink CLI Plugin

```bash
# Install the AppLink CLI plugin
heroku plugins:install @heroku-cli/plugin-applink
```

### 2. Connect to Salesforce Org

```bash
# Connect to a production org
heroku salesforce:connect production-org --addon your-addon-name -a your-app-name

# Connect to a sandbox org
heroku salesforce:connect sandbox-org --addon your-addon-name -a your-app-name --login-url https://test.salesforce.com
```

### 3. Authorize a User

```bash
# Authorize a Salesforce user for API access
heroku salesforce:authorizations:add auth-user --addon your-addon-name -a your-app-name
```

### 4. Publish Your App

```bash
# Publish the app to Salesforce as an External Service
heroku salesforce:publish api-spec.yaml \
  --client-name MyAPI \
  --connection-name production-org \
  --authorization-connected-app-name MyAppConnectedApp \
  --authorization-permission-set-name MyAppPermissions \
  --addon your-addon-name
```

### 5. Required Salesforce Permissions

Users need the "Manage Heroku AppLink" permission in Salesforce:

1. Go to Setup → Permission Sets
2. Create a new permission set or edit existing
3. Add "Manage Heroku AppLink" system permission
4. Assign the permission set to users

### 6. AppLink Buildpack Details

The `heroku/heroku-applink-service-mesh` buildpack provides:

- **Service Mesh Proxy**: Handles authentication and authorization
- **Request Validation**: Validates incoming Salesforce requests
- **Header Management**: Manages Salesforce client context headers
- **Security**: Ensures secure communication between Salesforce and your app

The service mesh runs on a separate port and proxies requests to your app, adding the necessary Salesforce context.

### 7. Connecting to Different Org Types

#### Production/Developer Orgs

```bash
heroku salesforce:connect prod-org --login-url https://login.salesforce.com
```

#### Sandbox Orgs

```bash
heroku salesforce:connect sandbox-org --login-url https://test.salesforce.com
```

#### Data Cloud Integration

```bash
heroku datacloud:connect datacloud-org --addon your-addon-name -a your-app-name
```

#### JWT Authentication (CI/CD)

```bash
heroku salesforce:connect:jwt cicd-org \
  --client-id YOUR_CLIENT_ID \
  --jwt-key-file path/to/server.key \
  --username your-username@company.com \
  --login-url https://login.salesforce.com
```

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with auto-reload
npm test           # Run test suite
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint errors
npm run format     # Format code with Prettier
```

## Additional Resources

### Documentation

- [Getting Started with Heroku AppLink](https://devcenter.heroku.com/articles/getting-started-heroku-applink)
- [Working with Heroku AppLink](https://devcenter.heroku.com/articles/working-with-heroku-applink)
- [Heroku AppLink CLI Plugin](https://devcenter.heroku.com/articles/heroku-applink-cli)
- [Fastify Documentation](https://fastify.dev/)

### Integration Guides

- [Heroku AppLink and Salesforce](https://devcenter.heroku.com/articles/getting-started-heroku-applink-salesforce)
- [Heroku AppLink and Data Cloud](https://devcenter.heroku.com/articles/getting-started-heroku-applink-data-cloud)
- [Heroku AppLink and Agentforce](https://devcenter.heroku.com/articles/getting-started-heroku-applink-agentforce)

### Support

- [Heroku AppLink Reference](https://devcenter.heroku.com/articles/heroku-applink-reference)
- [Heroku Support](https://help.heroku.com/)
- [Salesforce Developer Community](https://developer.salesforce.com/)

---

**Note**: This template is designed for educational purposes and as a starting point for building Salesforce-integrated applications. For production use, ensure proper error handling, security measures, and testing practices are implemented.

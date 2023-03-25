# PayAsYouGoVPN Framework

This repository contains the code for the PayAsYouGoVPN framework. It is organized as a monorepo with the following packages:

- `service`: Contains the code for the backend, including Lambda function handlers.
- `webApp`: Contains the code for the frontend, including a React website.
- `infrastructure`: Contains AWS CDK code to deploy the service and web app to an AWS account.

## Deployment Instructions

To deploy the PayAsYouGoVPN framework to an AWS account, follow these steps:

1. Set the `accountId` and `region` in the `packages/infrastructure/config/deployment.json` file to specify where resources should be deployed.
2. Run `npm run deployInfrastructure` to deploy the required stacks to your AWS account. You can monitor the progress of stack deployments in the CloudFormation console of your AWS account in the specified region. If there are any failures, you can troubleshoot them by checking the logs in the CloudFormation console.
3. When deployment is successful, you should have three stacks deployed:
    - `PayAsYouGoVPNBaseStack`: Contains base resources such as a CodeCommit repository.
    - `PayAsYouGoVPNFrontendStack`: Contains frontend resources for hosting the website.
    - `PayAsYouGoVPNServiceStack`: Contains backend resources such as Lambda functions.
4. Open the Amplify console for your specified region and select the `PayAsYouGoVPNAmplifyApp` Amplify app.
5. Choose `Run Build` if a build has not already started automatically. When successful, this step should build and deploy the web app to an Amplify endpoint.
6. Once deployment is successful, copy the Amplify website endpoint and open it to test that it works.
7. Sign up to create a new user account and then log in to use your personal VPN service.

## Development

The code for the PayAsYouGoVPN framework is organized into the following subpackages:

- `packages/infrastructure`: Contains the infrastructure code.
- `packages/service`: Contains the backend code.
- `packages/webApp`: Contains the frontend code.

To make changes to the framework, modify the relevant subpackage as needed.

## Testing the Web App Locally

To test the web app locally, follow these steps:

1. Update the `userPoolId`, `clientId`, and `identityPoolId` in the `packages/webApp/.env.development` file with values from your Cognito User Pool and Identity Pool. You can find these values in the Cognito console for your specified region.
2. Run `npm run startLocalWebApp` to start a local web server on port 3000. This can help you debug issues when developing the web app.

## Using the Website

To use the PayAsYouGoVPN website, follow these steps:

1. Click the `Sign Up` button to register for an account. To register, enter a valid email address, phone number, and password.
2. To log in, enter your email address and password.
3. Once you are logged in, you will see two pages:
    - `View Connections`: If you have any running VPN servers in any region, you will have the option to stop them by clicking the `Stop Connection` button. You can only have one VPN server running in any region at a time to conserve resources.
    - `Start New Connection`: If you do not have any running VPN servers, you will have the option to create one. Choose a region from the dropdown menu and click `Start Connection` to start a new connection. This can take up to a minute.
4. The `Usage History` tab shows your usage by region and provides a cost estimate so that you can stay within your budget.
5. The `Sign Out` tab logs you out of the app.
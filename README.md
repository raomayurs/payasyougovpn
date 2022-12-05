# PayAsYouGoVPN
This package contains the code for PayAsYouGoVPN frameworf

This is a monorepo with the following packages:
* service - Contains the code for the backend. i.e Lambda function handlers
* webApp - Contains the code for the frontend i.e React website
* infrastructure - CDK code to deploy the service and webapp to an aws account

## Steps to deploy to any AWS account
* Set the `accountId` and `region`in the config file `packages/infrastructure/config/deployment.json`, where the resources have to be deployed
* Execute `npm run deployInfrastructure` to deploy the required stacks to the aws account. In the CloudFormation console of the AWS account in the provided region, you can see the progress of the stack deployments. Any failures can be troubleshooted by lookin at the logs in the cloudformation console.
* When successful, you should have 3 stacks deployed:
    * PayAsYouGoVPNBaseStack - Consists of the base resources like the CodeCommit repo
    * PayAsYouGoVPNFrontendStack - Frontend resources required to host website
    * PayAsYouGoVPNServiceStack - Backend resources like lambda functions
* Open the amplify console for the provided region. Open the `PayAsYouGoVPNAmplifyApp` amplify app
* Choose `Run Build` if the build has not already started automatically. When successful, this step should build and deploy the web app to an amplify endpoint
* Once successful copy the amplify website endpoint and open it to test that it works.
* Sign up to create a new user.
* Then login to enjoy your personal VPN service

## Development



The code is divided as follows:

* packages/infrastructure contains the infrastructure code
* packages/service contains the backend code
* packages/webApp contains the frontend code

Make changes to the relevant subpackage by need

## Testing web app locally
* The Web app requires the Cognito Userpool and Identity pool details to be able to function successfully. Please update the `userPoolId`, `clientId` and `identityPoolId` in the env file `packages/webApp/.env.development`. These can be found from the Cognito console for the provided region
* Run `npm run startLocalWebApp` to start a local web server on port 3000. Can help debug when developing the web app.

## Website usage
* Use the `Sign Up` button to register
    * To register enter a valid email, phone number and password
* To Login enter the `email` and `password` to sign in
* Once signed in you will see:
    * View connections page - If you have any running vpn servers in any of the regions. You will have an option to `Stop Connection`. At any point in time you can have only one vpn server running in any region. This restriction has been added to remain frugal with resources.
    * Start new Connection page - If you dont have any running vpn servers then you will have the option to create one. Choose the `region` from dropdown menu and select `Start Connection` to start a connection. This can take upto a minute.
* The `Usage History` tab shows the usage by region and a cost estimate so that you can make sure you remain within your cost limits.
* The `Sign out` tab signs you out of the app.
import { App } from "aws-cdk-lib";
import { PayAsYouGoVPNBaseStack } from "./PayAsYouGoVPNBaseStack";
import { config as depoymentConfig } from "./config/deployment";

const app = new App();

new PayAsYouGoVPNBaseStack(app, 'PayAsYouGoVPNBaseStack', {
    env: {
      account: depoymentConfig.accountId,
      region: depoymentConfig.region,
    },
});
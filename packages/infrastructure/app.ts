import { App } from "aws-cdk-lib";
import { PayAsYouGoVPNBaseStack } from "./PayAsYouGoVPNBaseStack";
import * as depoymentConfig from "./config/depoymentConfig.json";

const app = new App();

new PayAsYouGoVPNBaseStack(app, 'PayAsYouGoVPNBaseStack', {
    env: {
      account: depoymentConfig.accountId,
      region: depoymentConfig.region,
    },
});
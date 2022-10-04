import { App } from "aws-cdk-lib";
import { PayAsYouGoVPNBaseStack } from "./PayAsYouGoVPNBaseStack";

const app = new App();

new PayAsYouGoVPNBaseStack(app, 'PayAsYouGoVPNBaseStack', {
    env: {
      account: "719694030497",
      region: "eu-west-2",
    },
});
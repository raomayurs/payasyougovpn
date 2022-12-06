const fs = require("fs");
const path = require("path");

const filepath = path.join(path.dirname(__dirname), ".env.production")

const userPoolId = process.argv[2];
const clientId = process.argv[3];
const identityPoolId = process.argv[4];
const region = process.argv[5];

const data = `REACT_APP_USER_POOL_ID=${userPoolId}\nREACT_APP_CLIENT_ID=${clientId}\nREACT_APP_IDENTITY_POOL_ID=${identityPoolId}\nREACT_APP_REGION=${region}`;
fs.writeFileSync(filepath, data); 
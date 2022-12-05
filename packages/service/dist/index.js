"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVPNSessions = exports.stopAllIdleServers = exports.getServerDetails = exports.stopServer = exports.startServer = void 0;
const aws_sdk_1 = require("aws-sdk");
const VPNServer_1 = require("./VPNServer");
const roleArn = "arn:aws:iam::719694030497:role/EC2AccessRole";
const supportedRegions = ["ap-south-1", "us-east-1", "eu-west-2", "ap-northeast-1"];
const getRoleCredentials = async (roleArn, region) => {
    const stsClient = new aws_sdk_1.STS({ region });
    const params = {
        RoleArn: roleArn,
        RoleSessionName: `test${Date.now()}`
    };
    const response = await stsClient.assumeRole(params).promise();
    if (response.Credentials) {
        return new aws_sdk_1.Credentials({
            accessKeyId: response === null || response === void 0 ? void 0 : response.Credentials.AccessKeyId,
            secretAccessKey: response === null || response === void 0 ? void 0 : response.Credentials.SecretAccessKey,
            sessionToken: response === null || response === void 0 ? void 0 : response.Credentials.SessionToken
        });
    }
    else {
        throw new Error("Could not fetch credentials");
    }
};
const startServer = async (event) => {
    const startTime = Date.now();
    console.log(JSON.stringify(event));
    console.log(`Starting VPN Connection in ${event.region} for user id ${event.userId}`);
    const credentials = await getRoleCredentials(roleArn, event.region);
    const vpnServer = new VPNServer_1.VPNServer(event.region, credentials);
    console.log(`VPN Server instance created`);
    const { connectionId, vpnServerDetails } = await vpnServer.start(event.userId);
    console.log(`VPN ConnectionID is ${connectionId}. Time taken ${(Date.now() - startTime) / 1000} seconds`);
    return { connectionId, vpnServerDetails };
};
exports.startServer = startServer;
const stopServer = async (event) => {
    console.log(JSON.stringify(event));
    console.log(`Stopping VPN Connection in ${event.region} for user id ${event.userId}`);
    const credentials = await getRoleCredentials(roleArn, event.region);
    const vpnServer = new VPNServer_1.VPNServer(event.region, credentials);
    await vpnServer.stop(event.connectionId, event.userId);
};
exports.stopServer = stopServer;
const getServerDetails = async (event) => {
    console.log(JSON.stringify(event));
    const region = "us-east-1";
    const credentials = await getRoleCredentials(roleArn, region);
    const vpnServer = new VPNServer_1.VPNServer(region, credentials);
    return vpnServer.getServerDetails(event.userId);
};
exports.getServerDetails = getServerDetails;
const stopAllIdleServers = async () => {
    for (const region of supportedRegions) {
        console.log(`Stopping all idle servers in ${region}`);
        const credentials = await getRoleCredentials(roleArn, region);
        const vpnServer = new VPNServer_1.VPNServer(region, credentials);
        await vpnServer.stopAllIdleServers();
    }
};
exports.stopAllIdleServers = stopAllIdleServers;
const getVPNSessions = async (event) => {
    const result = {};
    for (const region of supportedRegions) {
        console.log(`Stopping all idle servers in ${region}`);
        const credentials = await getRoleCredentials(roleArn, region);
        const vpnServer = new VPNServer_1.VPNServer(region, credentials);
        const vpnSessions = await vpnServer.getUsage(event.userId);
        if (vpnSessions) {
            result[region] = vpnSessions;
        }
    }
    return result;
};
exports.getVPNSessions = getVPNSessions;

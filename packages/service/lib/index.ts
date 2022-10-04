import { STS, Credentials } from "aws-sdk";
import { VPNServer, VPNSession } from "./VPNServer";


const roleArn = "arn:aws:iam::719694030497:role/EC2AccessRole";

const supportedRegions = [ "ap-south-1", "us-east-1", "eu-west-2", "ap-northeast-1" ];

const getRoleCredentials = async (roleArn: string, region: string): Promise<Credentials> => {
    const stsClient = new STS({region});
    const params = {
        RoleArn: roleArn,
        RoleSessionName: `test${Date.now()}`
    };
    const response = await stsClient.assumeRole(params).promise();
    if (response.Credentials) {
        return new Credentials({
            accessKeyId: response?.Credentials.AccessKeyId,
            secretAccessKey: response?.Credentials.SecretAccessKey,
            sessionToken: response?.Credentials.SessionToken
        })
    } else {
        throw new Error("Could not fetch credentials");
    }
}

export const startServer = async (event: {region: string, userId: string}) => {
    const startTime = Date.now();
    console.log(JSON.stringify(event))
    console.log(`Starting VPN Connection in ${event.region} for user id ${event.userId}`);
    const credentials = await getRoleCredentials(roleArn, event.region);
    const vpnServer = new VPNServer(event.region, credentials);
    console.log(`VPN Server instance created`);
    const { connectionId, vpnServerDetails } = await vpnServer.start(event.userId);
    console.log(`VPN ConnectionID is ${connectionId}. Time taken ${(Date.now() - startTime)/1000} seconds`);
    return { connectionId, vpnServerDetails };
}

export const stopServer = async (event: {region: string, connectionId: string, userId: string}) => {
    console.log(JSON.stringify(event))
    console.log(`Stopping VPN Connection in ${event.region} for user id ${event.userId}`);
    const credentials = await getRoleCredentials(roleArn, event.region);
    const vpnServer = new VPNServer(event.region, credentials);
    await vpnServer.stop(event.connectionId, event.userId);
}

export const getServerDetails = async (event: { userId: string }) => {
    console.log(JSON.stringify(event))
    const region = "us-east-1";
    const credentials = await getRoleCredentials(roleArn, region);
    const vpnServer = new VPNServer(region, credentials);
    return vpnServer.getServerDetails(event.userId);
}

export const stopAllIdleServers = async () => {
    for (const region of supportedRegions) {
        console.log(`Stopping all idle servers in ${region}`);
        const credentials = await getRoleCredentials(roleArn, region);
        const vpnServer = new VPNServer(region, credentials);
        await vpnServer.stopAllIdleServers();
    }
}

export const getVPNSessions = async (event: {userId: string}) => {
    const result: {[key: string]: VPNSession[]} = {};
    for (const region of supportedRegions) {
        console.log(`Stopping all idle servers in ${region}`);
        const credentials = await getRoleCredentials(roleArn, region);
        const vpnServer = new VPNServer(region, credentials);
        const vpnSessions = await vpnServer.getUsage(event.userId);
        if (vpnSessions) {
            result[region] = vpnSessions;
        }
    }
    return result;
}

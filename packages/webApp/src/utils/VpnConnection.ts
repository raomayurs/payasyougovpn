import { Lambda } from "aws-sdk";

export type ConnectionDetails = {
    connectionId: string;
    vpnServerDetails: {
        hostname: string,
        username: string,
        password: string,
        region: string,
    }
};

export type VPNSession = {
    instanceType: string,
    launchTime: string,
    stopTime: string,
    costPerHour: number,
    totalTimeUsed: number,
    costOfSession: number
};

export type VPNSessions = {
    [key: string]: VPNSession[];
};

const getAWSRegion = (country: string) => {
    const REGIONS_MAP = {
        "India": "ap-south-1",
        "United Kingdom": "eu-west-2",
        "United States": "us-east-1",
        "Japan": "ap-northeast-1"
    }

    return (REGIONS_MAP as any)[country];
};

export const startVPNConnection = async (lambdaClient: Lambda, country: string, userId: string) => {
    const region = getAWSRegion(country);
    try {
        const params = {
            FunctionName: "StartVPNServer",
            Payload: JSON.stringify({ region, userId })
        };
        const response = await lambdaClient.invoke(params).promise();
        const connectionDetails: ConnectionDetails = JSON.parse(response.Payload as string);
        return connectionDetails;
    } catch(err: any) {
        console.log(err);
        throw err;
    }
};

export const stopVPNConnection = async (lambdaClient: Lambda, userId: string, connectionId: string, region: string) => {
    try {
        const params = {
            FunctionName: "StopVPNServer",
            Payload: JSON.stringify({ region, connectionId, userId })
        };
        await lambdaClient.invoke(params).promise();
    } catch(err: any) {
        console.log(err);
        throw err;
    }
};


export const getServerDetails = async (lambdaClient: Lambda, userId: string) => {
    try {
        const params = {
            FunctionName: "GetServerDetails",
            Payload: JSON.stringify({ userId })
        };
        const response = await lambdaClient.invoke(params).promise();
        if (response.Payload != "null") {
            const connectionDetails: ConnectionDetails = JSON.parse(response.Payload as string);
            return connectionDetails;
        }
    } catch(err: any) {
        console.log(err);
        throw err;
    }
};

export const getVpnSessions = async (lambdaClient: Lambda, userId: string) => {
    const params = {
        FunctionName: "GetVPNSessions",
        Payload: JSON.stringify({ userId })
    };
    const response = await lambdaClient.invoke(params).promise();
    if (response.Payload != "null") {
        const vpnSessions: VPNSessions = JSON.parse(response.Payload as string);
        return vpnSessions;
    }
};

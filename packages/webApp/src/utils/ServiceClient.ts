import axios from 'axios'
import { ConnectionDetails, VPNSessions, getAWSRegion, getServerDetails as getVPNServerDetails, getVpnSessions, startVPNConnection, stopVPNConnection } from './VpnConnection';
import { Lambda } from 'aws-sdk';

export interface ServiceClient {
    startServer(country: string, userId: string): Promise<ConnectionDetails>;
    stopServer(userId: string, connectionId: string, region: string): Promise<void>;
    getServerDetails(userId: string): Promise<ConnectionDetails | undefined>;
    getVPNSessions(userId: string): Promise<VPNSessions | undefined>;
}

export class ServerClient implements ServiceClient {
    constructor(private host: string) {}

    async startServer(country: string, userId: string) {
        const { data } = await axios.post(`${this.host}/api/startServer`, { region: getAWSRegion(country), userId});
        return data;
    }

    async stopServer(userId: string, connectionId: string, region: string) {
        await axios.post(`${this.host}/api/stopServer`, { region, userId, connectionId });
    }

    async getServerDetails(userId: string) {
        const { data } = await axios.post(`${this.host}/api/getServerDetails`, { userId });
        return data;
    }
    
    async getVPNSessions(userId: string) {
        const { data } = await axios.post(`${this.host}/api/getVPNSessions`, { userId });
        return data;
    }
}

export class LambdaServiceClient implements ServiceClient {
    constructor(private lambdaClient: Lambda) {}

    async startServer(country: string, userId: string) {
        return startVPNConnection(this.lambdaClient, country, userId);
    }

    async stopServer(userId: string, connectionId: string, region: string) {
        await stopVPNConnection(this.lambdaClient, userId, connectionId, region);
    }

    async getServerDetails(userId: string) {
        return getVPNServerDetails(this.lambdaClient, userId)
    }

    async getVPNSessions(userId: string) {
        return getVpnSessions(this.lambdaClient, userId)
    }
}
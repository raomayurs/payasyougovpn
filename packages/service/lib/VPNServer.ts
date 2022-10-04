import { Credentials, EC2, S3 } from "aws-sdk";
import { Ec2Util } from "./Ec2Util";
import { S3Util } from "./S3Util";
import { areClientsConnected, setupVPNServer } from "./VPNServerConnection";
import * as uuid from "uuid";
import { getInstanceCost } from "./PriceUtil";

export type InstanceUsage = {
    instanceId: string,
    instanceType: string,
    launchTime: Date,
    stopTime?: Date
};

export type UsageData = {
    usage: InstanceUsage[]
};

export type VPNSession = {
    instanceType: string,
    launchTime: Date,
    stopTime: Date,
    costPerHour: number,
    totalTimeUsed: number,
    costOfSession: number
};

export class VPNServer {
    private ec2Util: Ec2Util;
    private s3Util: S3Util;
    constructor(private region: string, private credentials: Credentials) {
        const ec2Client = new EC2({...this.credentials, region});
        const s3Client = new S3({...this.credentials});
        this.s3Util = new S3Util(s3Client);
        this.ec2Util = new Ec2Util(ec2Client, region, this.s3Util);
    }

    async start(userId: string) {
        const connectionId = uuid.v4();
        const runningInstance = await this.ec2Util.getRunningInstance(userId, connectionId);
        runningInstance.region = this.region;
        console.log(`The VPN server started for the region ${this.region}`);

        await setupVPNServer(runningInstance);

        console.log(`Your VPN Login details for the region ${this.region} are as follows:`);
        const vpnServerDetails = {
            hostname: runningInstance.publicDnsName,
            username: runningInstance.username,
            password: runningInstance.password,
            region: runningInstance.region
        };
        console.log(vpnServerDetails);
        await this.s3Util.putFile(`connections/${userId}/${connectionId}`, JSON.stringify(runningInstance));
        return { connectionId, vpnServerDetails };
    }

    async stop(connectionId: string, userId: string) {
        const data = await this.s3Util.getFile(`connections/${userId}/${connectionId}`);
        if (data) {
            const instanceDetails = JSON.parse(data);
            const instanceUsage: any = await this.ec2Util.getInstanceDetails(instanceDetails.instanceId);
            if (instanceUsage) {
                await this.ec2Util.terminateInstance(instanceDetails);
                instanceUsage.stopTime = new Date();
                await this.s3Util.deleteFile(`connections/${userId}/${connectionId}`);
                await this.updateUsageStats(userId, instanceUsage);
                console.log("Usage Stats updates");
                console.log(`VPN server for the region ${this.region} has been terminated`);
            }
            
        }
    }

    private async updateUsageStats(userId: string, instanceUsage: InstanceUsage) {
        const usageFile = `usage/${this.region}/${userId}`;
        let data = await this.s3Util.getFile(usageFile);
        if (!data) {
            data = JSON.stringify({ usage: [] })
        }
        const usageData = JSON.parse(data);
        usageData.usage.push(instanceUsage);
        await this.s3Util.putFile(usageFile, JSON.stringify(usageData));
        console.log("Usage Data has been updated");
    }

    async getUsage(userId: string): Promise<VPNSession[] | undefined> {
        const usageFile = `usage/${this.region}/${userId}`;
        const data = await this.s3Util.getFile(usageFile);
        const vpnSessions: VPNSession[] = [];
        if (data) {
            const usageData: UsageData = JSON.parse(data);
            
            usageData.usage.forEach((instanceUsage) => {
                console.log(typeof instanceUsage.stopTime)
                console.log(new Date(instanceUsage.stopTime as any).getTime())
                const totalTimeUsed = new Date(instanceUsage.stopTime as any).getTime() - new Date(instanceUsage.launchTime as any).getTime();
                console.log(totalTimeUsed)
                const costPerHour = getInstanceCost(instanceUsage.instanceType, this.region);
                const costOfSession = (totalTimeUsed * costPerHour)/3600000;
                vpnSessions.push({
                    instanceType: instanceUsage.instanceType,
                    launchTime: instanceUsage.launchTime,
                    stopTime: instanceUsage.stopTime as any,
                    costPerHour,
                    totalTimeUsed,
                    costOfSession
                });
            });
            return vpnSessions
            
        }
    }

    async getServerDetails(userId: string) {
        const files = await this.s3Util.listFiles(`connections/${userId}`);
        if (files.length > 0) {
            const data = await this.s3Util.getFile(files[0] as string);
            if (data) {
                const instanceDetails = JSON.parse(data);
                const connectionId = files[0]?.split("/")[2];
                const vpnServerDetails = {
                    hostname: instanceDetails.publicDnsName,
                    username: instanceDetails.username,
                    password: instanceDetails.password,
                    region: instanceDetails.region
                };
                return { connectionId, vpnServerDetails };
            }
        }
        return undefined;
    }

    getTagValue(key: string, instance: EC2.Instance) {
        if (instance.Tags) {
            for (const tag of instance.Tags) {
                if (tag.Key === key) {
                    return tag.Value;
                }
            }
        }
        
    }

    async stopAllIdleServers() {
        const instances = await this.ec2Util.getRunningInstances();
        const keyName = `vpnServer-${this.region}`;
        const privateKey = await this.s3Util.getFile(`${keyName}.pem`);
        console.log(`Found ${instances.length} running servers`);

        for (let instance of instances) {
            const isClientsConnected = await areClientsConnected(instance.PublicDnsName as string, privateKey as string);
            if (!isClientsConnected) {
                const userId = this.getTagValue("UserId", instance) as string;
                const connectionId = this.getTagValue("ConnectionId", instance) as string;
                console.log(`${instance.PublicDnsName} is idle. Stopping it`);
                await this.stop(connectionId, userId);
            } else {
                console.log(`${instance.PublicDnsName} is not idle.`);
            }
        }
    }
}
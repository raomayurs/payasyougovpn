"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VPNServer = void 0;
const aws_sdk_1 = require("aws-sdk");
const Ec2Util_1 = require("./Ec2Util");
const S3Util_1 = require("./S3Util");
const VPNServerConnection_1 = require("./VPNServerConnection");
const uuid = __importStar(require("uuid"));
const PriceUtil_1 = require("./PriceUtil");
class VPNServer {
    constructor(region, credentials) {
        this.region = region;
        this.credentials = credentials;
        const ec2Client = new aws_sdk_1.EC2({ ...this.credentials, region });
        const s3Client = new aws_sdk_1.S3({ ...this.credentials });
        this.s3Util = new S3Util_1.S3Util(s3Client);
        this.ec2Util = new Ec2Util_1.Ec2Util(ec2Client, region, this.s3Util);
    }
    async start(userId) {
        const connectionId = uuid.v4();
        const runningInstance = await this.ec2Util.getRunningInstance(userId, connectionId);
        runningInstance.region = this.region;
        console.log(`The VPN server started for the region ${this.region}`);
        await (0, VPNServerConnection_1.setupVPNServer)(runningInstance);
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
    async stop(connectionId, userId) {
        const data = await this.s3Util.getFile(`connections/${userId}/${connectionId}`);
        if (data) {
            await this.s3Util.deleteFile(`connections/${userId}/${connectionId}`);
            const instanceDetails = JSON.parse(data);
            const instanceUsage = await this.ec2Util.getInstanceDetails(instanceDetails.instanceId);
            if (instanceUsage) {
                await this.ec2Util.terminateInstance(instanceDetails);
                instanceUsage.stopTime = new Date();
                await this.updateUsageStats(userId, instanceUsage);
                console.log("Usage Stats updates");
                console.log(`VPN server for the region ${this.region} has been terminated`);
            }
        }
    }
    async updateUsageStats(userId, instanceUsage) {
        const usageFile = `usage/${this.region}/${userId}`;
        let data = await this.s3Util.getFile(usageFile);
        if (!data) {
            data = JSON.stringify({ usage: [] });
        }
        const usageData = JSON.parse(data);
        usageData.usage.push(instanceUsage);
        await this.s3Util.putFile(usageFile, JSON.stringify(usageData));
        console.log("Usage Data has been updated");
    }
    async getUsage(userId) {
        const usageFile = `usage/${this.region}/${userId}`;
        const data = await this.s3Util.getFile(usageFile);
        const vpnSessions = [];
        if (data) {
            const usageData = JSON.parse(data);
            usageData.usage.forEach((instanceUsage) => {
                console.log(typeof instanceUsage.stopTime);
                console.log(new Date(instanceUsage.stopTime).getTime());
                const totalTimeUsed = new Date(instanceUsage.stopTime).getTime() - new Date(instanceUsage.launchTime).getTime();
                console.log(totalTimeUsed);
                const costPerHour = (0, PriceUtil_1.getInstanceCost)(instanceUsage.instanceType, this.region);
                const costOfSession = (totalTimeUsed * costPerHour) / 3600000;
                vpnSessions.push({
                    instanceType: instanceUsage.instanceType,
                    launchTime: instanceUsage.launchTime,
                    stopTime: instanceUsage.stopTime,
                    costPerHour,
                    totalTimeUsed,
                    costOfSession
                });
            });
            return vpnSessions;
        }
    }
    async getServerDetails(userId) {
        var _a;
        const files = await this.s3Util.listFiles(`connections/${userId}`);
        if (files.length > 0) {
            const data = await this.s3Util.getFile(files[0]);
            if (data) {
                const instanceDetails = JSON.parse(data);
                const connectionId = (_a = files[0]) === null || _a === void 0 ? void 0 : _a.split("/")[2];
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
    getTagValue(key, instance) {
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
            const isClientsConnected = await (0, VPNServerConnection_1.areClientsConnected)(instance.PublicDnsName, privateKey);
            if (!isClientsConnected) {
                const userId = this.getTagValue("UserId", instance);
                const connectionId = this.getTagValue("ConnectionId", instance);
                console.log(`${instance.PublicDnsName} is idle. Stopping it`);
                await this.stop(connectionId, userId);
            }
            else {
                console.log(`${instance.PublicDnsName} is not idle.`);
            }
        }
    }
}
exports.VPNServer = VPNServer;

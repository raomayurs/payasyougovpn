"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ec2Util = void 0;
const PASSWORD = "mayurrao";
const sleep = async (timeout) => {
    await new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
};
const REGION_DATA = {
    "ap-south-1": {
        username: "india",
        imageId: "ami-029cb972e1b8a4bca"
    },
    "us-east-1": {
        username: "usa",
        imageId: "ami-037ff6453f0855c46"
    },
    "eu-west-2": {
        username: "england",
        imageId: "ami-056465a2a49aad6d9"
    },
    "ap-northeast-1": {
        username: "japan",
        imageId: "ami-04f47c2ec43830d77"
    },
};
class Ec2Util {
    constructor(ec2Client, region, s3Util) {
        this.ec2Client = ec2Client;
        this.region = region;
        this.s3Util = s3Util;
    }
    async getRunningInstances() {
        var _a;
        const params = {
            Filters: [
                {
                    Name: "instance-state-code",
                    Values: [
                        "16"
                    ]
                },
                {
                    Name: "tag:Name",
                    Values: [
                        "VPNServer"
                    ]
                },
            ]
        };
        const response = await this.ec2Client.describeInstances(params).promise();
        if ((response === null || response === void 0 ? void 0 : response.Reservations) && ((_a = response === null || response === void 0 ? void 0 : response.Reservations) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            let instances = [];
            response === null || response === void 0 ? void 0 : response.Reservations.forEach((reservation) => {
                if (reservation.Instances) {
                    instances = instances.concat(reservation.Instances);
                }
            });
            return instances;
        }
        return [];
    }
    async getInstancesForUserId(userId) {
        var _a;
        const params = {
            Filters: [
                {
                    Name: "instance-type",
                    Values: [
                        "t2.micro"
                    ]
                },
                {
                    Name: "instance-state-code",
                    Values: [
                        "16", "64", "80"
                    ]
                },
                {
                    Name: "tag:Name",
                    Values: [
                        "VPNServer"
                    ]
                },
                {
                    Name: "tag:UserId",
                    Values: [
                        userId
                    ]
                }
            ],
            MaxResults: 1000
        };
        const keyPairDetails = await this.getKeyPair();
        const response = await this.ec2Client.describeInstances(params).promise();
        if ((response === null || response === void 0 ? void 0 : response.Reservations) && ((_a = response === null || response === void 0 ? void 0 : response.Reservations) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            let instances = [];
            response === null || response === void 0 ? void 0 : response.Reservations.forEach((reservation) => {
                if (reservation.Instances) {
                    instances = instances.concat(reservation.Instances);
                }
            });
            return instances.map((instanceData) => {
                var _a;
                return {
                    instanceId: instanceData.InstanceId,
                    publicDnsName: instanceData.PublicDnsName,
                    publicIp: instanceData.PublicIpAddress,
                    status: (_a = instanceData === null || instanceData === void 0 ? void 0 : instanceData.State) === null || _a === void 0 ? void 0 : _a.Name,
                    keyPair: keyPairDetails
                };
            });
        }
        return [];
    }
    async createSecurityGroup() {
        let params = {
            Description: "VPNServer",
            GroupName: "VPNServer"
        };
        const response = await this.ec2Client.createSecurityGroup(params).promise();
        const securityGroupId = response.GroupId;
        const params1 = {
            GroupId: securityGroupId,
            IpPermissions: [
                {
                    IpProtocol: "tcp",
                    IpRanges: [
                        {
                            CidrIp: "0.0.0.0/0"
                        }
                    ],
                    FromPort: 22,
                    ToPort: 22
                },
                {
                    IpProtocol: "tcp",
                    IpRanges: [
                        {
                            CidrIp: "0.0.0.0/0"
                        }
                    ],
                    FromPort: 943,
                    ToPort: 945
                },
                {
                    IpProtocol: "tcp",
                    IpRanges: [
                        {
                            CidrIp: "0.0.0.0/0"
                        }
                    ],
                    FromPort: 443,
                    ToPort: 443
                },
                {
                    IpProtocol: "udp",
                    IpRanges: [
                        {
                            CidrIp: "0.0.0.0/0"
                        }
                    ],
                    FromPort: 1194,
                    ToPort: 1194
                }
            ]
        };
        await this.ec2Client.authorizeSecurityGroupIngress(params1).promise();
        return securityGroupId;
    }
    async getSecurityGroup() {
        const params = {
            Filters: [
                {
                    Name: "group-name",
                    Values: ["VPNServer"]
                }
            ]
        };
        const response = await this.ec2Client.describeSecurityGroups(params).promise();
        if (response.SecurityGroups && response.SecurityGroups.length > 0 && response.SecurityGroups[0].GroupId) {
            return response.SecurityGroups[0].GroupId;
        }
        else {
            console.log("Creating new securty group for VPN Server");
            return this.createSecurityGroup();
        }
    }
    async createKeyPair(keyName) {
        const params = {
            KeyName: keyName
        };
        const response = await this.ec2Client.createKeyPair(params).promise();
        return {
            keyName,
            pemData: response.KeyMaterial
        };
    }
    async waitForInstanceToStartRunning(instanceDetails) {
        var _a, _b, _c, _d, _e, _f, _g;
        if (instanceDetails.instanceId) {
            const params = {
                InstanceIds: [instanceDetails.instanceId]
            };
            let status = instanceDetails.status;
            let result = {
                instanceId: instanceDetails.instanceId,
                keyPair: instanceDetails.keyPair
            };
            const endTime = Date.now() + 120000;
            while (status !== "running" && Date.now() < endTime) {
                await sleep(1000);
                const response = await this.ec2Client.describeInstances(params).promise();
                status = (_c = (_b = (_a = response.Reservations) === null || _a === void 0 ? void 0 : _a[0].Instances) === null || _b === void 0 ? void 0 : _b[0].State) === null || _c === void 0 ? void 0 : _c.Name;
                console.log(`Instance is in ${status} state`);
                result.publicDnsName = (_e = (_d = response.Reservations) === null || _d === void 0 ? void 0 : _d[0].Instances) === null || _e === void 0 ? void 0 : _e[0].PublicDnsName;
                result.publicIp = (_g = (_f = response.Reservations) === null || _f === void 0 ? void 0 : _f[0].Instances) === null || _g === void 0 ? void 0 : _g[0].PublicIpAddress;
            }
            if (status !== "running") {
                throw new Error("The instance did not reach running state after 2 minutes");
            }
            // console.log("Waiting 35s for instance to initialize");
            // await sleep(35000);
            return result;
        }
        else {
            throw new Error("InstanceId is required for waitForInstanceToStartRunning");
        }
    }
    async getKeyPair() {
        console.log("Getting SSH Key pair");
        const keyName = `vpnServer-${this.region}`;
        const keyData = await this.s3Util.getFile(`${keyName}.pem`);
        if (!keyData) {
            console.log(`Creating key pair ${keyName}`);
            const keyDetails = await this.createKeyPair(keyName);
            await this.s3Util.putFile(`${keyDetails.keyName}.pem`, keyDetails.pemData);
            return keyDetails;
        }
        else {
            return {
                keyName,
                pemData: keyData
            };
        }
    }
    async createInstance(userId, connectionId) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const securityGroupId = await this.getSecurityGroup();
        const keyPairDetails = await this.getKeyPair();
        const data = `admin_user=${(_b = (_a = REGION_DATA[this.region]) === null || _a === void 0 ? void 0 : _a.username) !== null && _b !== void 0 ? _b : "default"}\n` + `admin_pw=${PASSWORD}\n` + "reroute_gw=1\n" + "reroute_dns=1";
        const userData = Buffer.from(data).toString('base64');
        const params = {
            ImageId: (_c = REGION_DATA[this.region]) === null || _c === void 0 ? void 0 : _c.imageId,
            BlockDeviceMappings: [
                {
                    DeviceName: "/dev/sda1",
                    Ebs: {
                        VolumeSize: 8,
                        VolumeType: "gp3"
                    }
                }
            ],
            UserData: userData,
            TagSpecifications: [
                {
                    ResourceType: "instance",
                    Tags: [
                        {
                            Key: "Name",
                            Value: "VPNServer"
                        },
                        {
                            Key: "UserId",
                            Value: userId
                        },
                        {
                            Key: "ConnectionId",
                            Value: connectionId
                        }
                    ]
                }
            ],
            KeyName: keyPairDetails.keyName,
            MinCount: 1,
            MaxCount: 1,
            InstanceType: "t2.micro",
            SecurityGroupIds: [securityGroupId]
        };
        const response = await this.ec2Client.runInstances(params).promise();
        if (response.Instances && response.Instances.length === 1) {
            const instanceDetails = {
                instanceId: (_d = response.Instances) === null || _d === void 0 ? void 0 : _d[0].InstanceId,
                publicDnsName: (_e = response.Instances) === null || _e === void 0 ? void 0 : _e[0].PublicDnsName,
                publicIp: (_f = response.Instances) === null || _f === void 0 ? void 0 : _f[0].PublicIpAddress,
                status: (_h = (_g = response.Instances) === null || _g === void 0 ? void 0 : _g[0].State) === null || _h === void 0 ? void 0 : _h.Name,
                keyPair: keyPairDetails
            };
            if (instanceDetails.status !== "running") {
                return this.waitForInstanceToStartRunning(instanceDetails);
            }
            return instanceDetails;
        }
        else {
            throw new Error("Could not create instance");
        }
    }
    async setInstanceStateToRunning(instanceDetails) {
        if (instanceDetails.instanceId) {
            const params = {
                InstanceIds: [instanceDetails.instanceId]
            };
            await this.ec2Client.startInstances(params).promise();
            return this.waitForInstanceToStartRunning(instanceDetails);
        }
        else {
            throw new Error("InstanceId must be defined for setInstanceStateToRunning");
        }
    }
    async getRunningInstance(userId, connectionId) {
        console.log("Trying to find running VPN instance");
        const instances = await this.getInstancesForUserId(userId);
        let runningInstance = instances.find(i => i.status === "running");
        if (!runningInstance) {
            console.log("No running VPN instances found");
            const stoppedInstance = instances.find(i => i.status === "stopped" || i.status === "stopping");
            if (!stoppedInstance) {
                console.log("No stopped VPN instances found. Creating a VPN instance");
                runningInstance = await this.createInstance(userId, connectionId);
            }
            else {
                console.log("Stopped instance found. Starting it...");
                const params = {
                    Resources: [stoppedInstance.instanceId],
                    Tags: [
                        {
                            Key: "ConnectionId",
                            Value: connectionId
                        }
                    ]
                };
                await this.ec2Client.createTags(params).promise();
                console.log("Updated the connectionId tag");
                runningInstance = await this.setInstanceStateToRunning(stoppedInstance);
            }
        }
        runningInstance.username = REGION_DATA[this.region].username;
        runningInstance.password = PASSWORD;
        return runningInstance;
    }
    async getInstanceDetails(instanceId) {
        var _a, _b, _c, _d;
        const params = {
            InstanceIds: [instanceId]
        };
        const response = await this.ec2Client.describeInstances(params).promise();
        if ((response === null || response === void 0 ? void 0 : response.Reservations) && ((_a = response === null || response === void 0 ? void 0 : response.Reservations) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            const instance = (_d = (_c = (_b = response === null || response === void 0 ? void 0 : response.Reservations) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.Instances) === null || _d === void 0 ? void 0 : _d[0];
            if (!instance) {
                throw new Error("Instance could not be found");
            }
            else {
                return {
                    instanceId,
                    launchTime: instance.LaunchTime,
                    instanceType: instance.InstanceType
                };
            }
        }
    }
    async stopInstance(instanceDetails) {
        const params = {
            InstanceIds: [instanceDetails.instanceId]
        };
        await this.ec2Client.stopInstances(params).promise();
        console.log(`Instance ${instanceDetails.instanceId} has been stopped`);
    }
    async terminateInstance(instanceDetails) {
        const params = {
            InstanceIds: [instanceDetails.instanceId]
        };
        await this.ec2Client.terminateInstances(params).promise();
        console.log(`Instance ${instanceDetails.instanceId} has been terminated`);
    }
}
exports.Ec2Util = Ec2Util;

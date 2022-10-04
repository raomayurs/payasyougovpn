import { EC2 } from "aws-sdk";
import { S3Util } from "./S3Util";

export type InstanceDetails = {
    instanceId?: string,
    publicDnsName?: string,
    publicIp?: string;
    status?: string;
    keyPair?: KeyDetails;
    username?: string;
    password?: string;
}

export type KeyDetails = {
    keyName: string,
    pemData?: string
}

const PASSWORD = "mayurrao";

const sleep = async (timeout: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}

const REGION_DATA: { [key: string] : any } = {
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
}

export class Ec2Util {
    constructor(private ec2Client: EC2, private region: string, private s3Util: S3Util) {}

    async getRunningInstances() {
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
        if (response?.Reservations && response?.Reservations?.length > 0) {
            let instances: EC2.InstanceList = [];
            response?.Reservations.forEach((reservation) => {
                if (reservation.Instances) {
                    instances = instances.concat(reservation.Instances)
                }
            });
            return instances;
        }
        return [];
    }

    private async getInstancesForUserId(userId: string): Promise<InstanceDetails[]> {
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
        if (response?.Reservations && response?.Reservations?.length > 0) {
            let instances: EC2.InstanceList = [];
            response?.Reservations.forEach((reservation) => {
                if (reservation.Instances) {
                    instances = instances.concat(reservation.Instances)
                }
            })
            return instances.map((instanceData) => {
                return {
                    instanceId: instanceData.InstanceId,
                    publicDnsName: instanceData.PublicDnsName,
                    publicIp: instanceData.PublicIpAddress,
                    status: instanceData?.State?.Name,
                    keyPair: keyPairDetails
                }
            });
        }
        return [];
    }

    private async createSecurityGroup() {
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

    private async getSecurityGroup(): Promise<string | undefined> {
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
        } else {
            console.log("Creating new securty group for VPN Server");
            return this.createSecurityGroup();
            
        }
    }

    private async createKeyPair(keyName: string) {
        const params = {
            KeyName: keyName
        };
        
        const response = await this.ec2Client.createKeyPair(params).promise();
        return {
            keyName,
            pemData: response.KeyMaterial
        };
    }

    async waitForInstanceToStartRunning(instanceDetails: InstanceDetails): Promise<InstanceDetails> {
        if (instanceDetails.instanceId) {
            const params = {
                InstanceIds: [instanceDetails.instanceId]
            };
    
            let status = instanceDetails.status;
            let result: InstanceDetails = {
                instanceId: instanceDetails.instanceId,
                keyPair: instanceDetails.keyPair
            };
            const endTime = Date.now() + 120000;
            while (status !== "running" && Date.now() < endTime) {
                await sleep(1000);
                const response = await this.ec2Client.describeInstances(params).promise();
                status = response.Reservations?.[0].Instances?.[0].State?.Name;
                console.log(`Instance is in ${status} state`);
                result.publicDnsName = response.Reservations?.[0].Instances?.[0].PublicDnsName;
                result.publicIp = response.Reservations?.[0].Instances?.[0].PublicIpAddress;
            }

            if (status !== "running") {
                throw new Error("The instance did not reach running state after 2 minutes");
            }

            // console.log("Waiting 35s for instance to initialize");
            // await sleep(35000);
            return result;


        } else {
            throw new Error("InstanceId is required for waitForInstanceToStartRunning");
        }
        
    }

    private async getKeyPair(): Promise<KeyDetails> {
        console.log("Getting SSH Key pair");
        const keyName = `vpnServer-${this.region}`;
        const keyData = await this.s3Util.getFile(`${keyName}.pem`);
        if (!keyData) {
            console.log(`Creating key pair ${keyName}`);
            const keyDetails = await this.createKeyPair(keyName);
            await this.s3Util.putFile(`${keyDetails.keyName}.pem`, keyDetails.pemData as string);
            return keyDetails;
        } else {
            return {
                keyName,
                pemData: keyData
            }
        }   
    }
    
    async createInstance(userId: string, connectionId: string): Promise<InstanceDetails> {
        const securityGroupId = await this.getSecurityGroup();
        const keyPairDetails = await this.getKeyPair();
        const data = `admin_user=${REGION_DATA[this.region]?.username ?? "default"}\n` + `admin_pw=${PASSWORD}\n` + "reroute_gw=1\n" + "reroute_dns=1";
        const userData = Buffer.from(data).toString('base64');
        const params = {
            ImageId: REGION_DATA[this.region]?.imageId,
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
            SecurityGroupIds: [ securityGroupId as string ]
        };
        
        const response = await this.ec2Client.runInstances(params).promise();
        if (response.Instances && response.Instances.length === 1) {
            const instanceDetails: InstanceDetails = {
                instanceId: response.Instances?.[0].InstanceId,
                publicDnsName: response.Instances?.[0].PublicDnsName,
                publicIp: response.Instances?.[0].PublicIpAddress,
                status: response.Instances?.[0].State?.Name,
                keyPair: keyPairDetails
            };

            if (instanceDetails.status !== "running") {
                return this.waitForInstanceToStartRunning(instanceDetails);
            }

            return instanceDetails;

        } else {
            throw new Error("Could not create instance");
        }
        
    }

    async setInstanceStateToRunning(instanceDetails: InstanceDetails): Promise<InstanceDetails> {
        if (instanceDetails.instanceId) {
            const params = {
                InstanceIds: [ instanceDetails.instanceId ]
            };
    
            await this.ec2Client.startInstances(params).promise();
            return this.waitForInstanceToStartRunning(instanceDetails);
        } else {
            throw new Error("InstanceId must be defined for setInstanceStateToRunning");
        }
        
    }

    async getRunningInstance(userId: string, connectionId: string): Promise<any> {
        console.log("Trying to find running VPN instance");
        const instances = await this.getInstancesForUserId(userId);
        let runningInstance = instances.find(i => i.status === "running");
        if (!runningInstance) {
            console.log("No running VPN instances found");
            const stoppedInstance = instances.find(i => i.status === "stopped" || i.status === "stopping");
            if (!stoppedInstance) {
                console.log("No stopped VPN instances found. Creating a VPN instance");
                runningInstance = await this.createInstance(userId, connectionId);
            } else {
                console.log("Stopped instance found. Starting it...");
                const params = {
                    Resources: [stoppedInstance.instanceId as string], 
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
    
    async getInstanceDetails(instanceId: string) {
        const params = {
            InstanceIds: [ instanceId ]
        };
        const response = await this.ec2Client.describeInstances(params).promise();
        if (response?.Reservations && response?.Reservations?.length > 0) {
            const instance: EC2.Instance | undefined = response?.Reservations?.[0]?.Instances?.[0];
            if (!instance) {
                throw new Error("Instance could not be found")
            } else {
                return {
                    instanceId,
                    launchTime: instance.LaunchTime,
                    instanceType: instance.InstanceType
                }
            }
            
        }
    }

    async stopInstance(instanceDetails: InstanceDetails) {
        const params = {
            InstanceIds: [ instanceDetails.instanceId as string ]
        };
        await this.ec2Client.stopInstances(params).promise();
        console.log(`Instance ${instanceDetails.instanceId} has been stopped`);
    }

    async terminateInstance(instanceDetails: InstanceDetails) {
        const params = {
            InstanceIds: [ instanceDetails.instanceId as string ]
        };
        await this.ec2Client.terminateInstances(params).promise();
        console.log(`Instance ${instanceDetails.instanceId} has been terminated`);
    }
}

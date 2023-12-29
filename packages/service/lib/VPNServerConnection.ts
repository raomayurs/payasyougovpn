import {NodeSSH} from 'node-ssh';
import { InstanceDetails } from './Ec2Util';

const ssh = new NodeSSH();

async function sshConnect(hostname: string, privateKey: string) {
    await ssh.connect({
        host: hostname,
        username: "openvpnas",
        privateKey: privateKey,
        timeout: 45000,
        readyTimeout: 45000
    });
}

const sleep = async (timeout: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}

export const setupVPNServer = async (instanceDetails: InstanceDetails) => {
    if (!instanceDetails.publicDnsName || !instanceDetails.keyPair) {
        throw new Error("Public dns name and key required to setup VPN server");
    } else {
        await waitForServerToStart(instanceDetails.publicDnsName, instanceDetails.keyPair.pemData as string);

        let result = await ssh.execCommand(`sudo /usr/local/openvpn_as/scripts/sacli --key "host.name" --value ${instanceDetails.publicDnsName} ConfigPut`);
        if (result.stderr) {
            console.log('Server host configuration failed ' + result.stderr);
            throw new Error(result.stderr);
        }

        result = await ssh.execCommand(`sudo /usr/local/openvpn_as/scripts/sacli start`);
        if (result.stderr) {
            console.log('Server Start command failed; ' + result.stderr);
            throw new Error(result.stderr);
        }
        console.log("VPN Server initialization successful");
        ssh.dispose();
    }
};

const waitForServerToStart = async (hostname: string, privateKey: string) => {
    const startTime = Date.now();
    let isConnected = false;
    while (Date.now() -  startTime < 55000 && !isConnected) {
        try {
            await sshConnect(hostname, privateKey);
            const result = await ssh.execCommand(`sudo /usr/local/openvpn_as/scripts/sacli VPNSummary`);
            if (result.stderr) {
                throw new Error(result.stderr)
            }
            isConnected = true;
        } catch(err) {
            console.log("Server is initializing");
            ssh.dispose();
            await sleep(1000);
        }
    }
    if (isConnected) {
        console.log("SSH connection successful");
    } else {
        throw new Error(`Could not connect to VPN Server ${hostname}`);
    }
}

export const areClientsConnected = async (hostname: string, privateKey: string): Promise<any> => {
    await sshConnect(hostname, privateKey);
    console.log("Successfully connected to server");
    const result = await ssh.execCommand("sudo /usr/local/openvpn_as/scripts/sacli VPNSummary");
    if (result.stderr) {
        console.log("Failed to fetch connected clients", result.stderr);
        throw new Error(result.stderr);
    }
    ssh.dispose();
    const numberOfConectedClients = JSON.parse(result.stdout).n_clients;
    return numberOfConectedClients > 0;
}
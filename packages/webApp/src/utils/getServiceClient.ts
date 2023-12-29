import appConfig from "../config/appConfig";
import { getLambdaClient } from "./LambdaUtil";
import { LambdaServiceClient, ServerClient, ServiceClient } from "./ServiceClient";
export const getServiceClient = (region: string): ServiceClient | undefined => {
    if (appConfig.serviceClientType === 'server') {
        return new ServerClient('http://localhost:3111')
    } else {
        const lambdaClient = getLambdaClient(region)
        if (lambdaClient) {
            return new LambdaServiceClient(lambdaClient);
        }
    }
}
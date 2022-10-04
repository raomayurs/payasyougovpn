import { Lambda } from "aws-sdk";

export const getLambdaClient = (region: string) => {
    const accessKeyId = sessionStorage.getItem("accessKeyId");
    const secretAccessKey = sessionStorage.getItem("secretAccessKey");
    const sessionToken = sessionStorage.getItem("sessionToken");

    if (!accessKeyId || !secretAccessKey || !sessionToken) {
       // console.error("Credentials undefined");
        //return undefined;
        throw new Error("Credentials undefined")
    } else {
        const credentials = {accessKeyId, secretAccessKey, sessionToken };
        return new Lambda({credentials, region });
    }
    
    
}
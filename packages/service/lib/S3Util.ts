import { S3 } from "aws-sdk";

const BUCKET_NAME = 'payasyougovpnsshkeys';

export class S3Util {
    constructor(private s3Client: S3) {}

    async getFile(filename: string): Promise<string | undefined> {
        const params = {
            Bucket: BUCKET_NAME,
            Key: filename
        };
        try {
            const response = await this.s3Client.getObject(params).promise();
            return response.Body?.toString();

        } catch(err: any) {
            if (err.name === "NoSuchKey") {
                return undefined;
            }
            throw err;
        }
        
        
    }

    async listFiles(prefix: string): Promise<(string | undefined)[]> {
        const params = {
            Bucket: BUCKET_NAME,
            Prefix: prefix,
        };

        const response = await this.s3Client.listObjects(params).promise();
        if (response.Contents) {
            return (response.Contents).map(c => c.Key);
        }
        return [];
    }

    async putFile(filename: string, data: string): Promise<void> {
        const params = {
            Bucket: BUCKET_NAME,
            Key: filename,
            Body: data
        };
        await this.s3Client.putObject(params).promise();
    }

    async deleteFile(filename: string): Promise<void> {
        const params = {
            Bucket: BUCKET_NAME,
            Key: filename,
        };
        await this.s3Client.deleteObject(params).promise();
    }
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Util = void 0;
const BUCKET_NAME = 'payasyougovpnsshkeys';
class S3Util {
    constructor(s3Client) {
        this.s3Client = s3Client;
    }
    async getFile(filename) {
        var _a;
        const params = {
            Bucket: BUCKET_NAME,
            Key: filename
        };
        try {
            const response = await this.s3Client.getObject(params).promise();
            return (_a = response.Body) === null || _a === void 0 ? void 0 : _a.toString();
        }
        catch (err) {
            if (err.name === "NoSuchKey") {
                return undefined;
            }
            throw err;
        }
    }
    async listFiles(prefix) {
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
    async putFile(filename, data) {
        const params = {
            Bucket: BUCKET_NAME,
            Key: filename,
            Body: data
        };
        await this.s3Client.putObject(params).promise();
    }
    async deleteFile(filename) {
        const params = {
            Bucket: BUCKET_NAME,
            Key: filename,
        };
        await this.s3Client.deleteObject(params).promise();
    }
}
exports.S3Util = S3Util;

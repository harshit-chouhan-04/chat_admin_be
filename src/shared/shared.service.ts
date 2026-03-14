import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class SharedService {
  private readonly s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  getCloudFrontUrl(key: string): string {
    const fileKey = key.split(process.env.BUCKET_LINK!)[1];
    const signedUrl = `${process.env.CLOUDFRONT_LINK}${fileKey}`;
    return signedUrl;
  }
  async getInvoiceSignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_INVOICE,
      Key: key,
    });
    const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
    return signedUrl;
  }
}

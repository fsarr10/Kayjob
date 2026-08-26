import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function clientConfig() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET) {
    throw Object.assign(new Error("Cloudflare R2 storage is not configured"), { statusCode: 503 });
  }
  return {
    client: new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY }
    }),
    bucket: process.env.R2_BUCKET
  };
}

export async function signedUpload(key, contentType, expiresIn = 900) {
  const { client, bucket } = clientConfig();
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn });
}

export async function signedDownload(key, expiresIn = 300) {
  const { client, bucket } = clientConfig();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

export async function streamObject(key, range) {
  const { client, bucket } = clientConfig();
  return client.send(new GetObjectCommand({ Bucket: bucket, Key: key, ...(range ? { Range: range } : {}) }));
}

export async function headObject(key) {
  const { client, bucket } = clientConfig();
  return client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
}

export async function deleteObject(key) {
  const { client, bucket } = clientConfig();
  return client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

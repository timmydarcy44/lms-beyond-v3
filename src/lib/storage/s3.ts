import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const getConfig = () => {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "us-east-1";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID ?? "";
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY ?? "";
  const bucket = process.env.S3_BUCKET ?? "";
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL ?? "";

  return { endpoint, region, accessKeyId, secretAccessKey, bucket, publicBaseUrl };
};

const client = () => {
  const { endpoint, region, accessKeyId, secretAccessKey } = getConfig();
  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    credentials: { accessKeyId, secretAccessKey },
  });
};

export const uploadBuffer = async (params: {
  key: string;
  buffer: Buffer;
  contentType: string;
  isPublic?: boolean;
}) => {
  const { bucket } = getConfig();
  if (!bucket) {
    throw new Error("S3_BUCKET missing");
  }
  const s3 = client();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType,
      ACL: params.isPublic ? "public-read" : undefined,
    }),
  );
  return buildPublicUrl(params.key);
};

export const buildPublicUrl = (key: string) => {
  const { publicBaseUrl, bucket, endpoint } = getConfig();
  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }
  if (endpoint) {
    return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
  }
  return `https://${bucket}.s3.amazonaws.com/${key}`;
};

export const createSignedUrl = async (params: {
  key: string;
  contentType: string;
  expiresIn?: number;
}) => {
  const { bucket } = getConfig();
  if (!bucket) {
    throw new Error("S3_BUCKET missing");
  }
  const s3 = client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: params.expiresIn ?? 900 });
};

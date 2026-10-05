import { S3Client } from "@aws-sdk/client-s3";
const accountId=process.env.R2_ACCOUNT_ID,bucket=process.env.R2_BUCKET_NAME,accessKeyId=process.env.R2_ACCESS_KEY_ID,secretAccessKey=process.env.R2_SECRET_ACCESS_KEY;
export function r2Config(){if(!accountId||!bucket||!accessKeyId||!secretAccessKey)throw new Error("R2 is not configured. Set R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.");return{accountId,bucket};}
export function r2(){const{accountId}=r2Config();return new S3Client({region:"auto",endpoint:`https://${accountId}.r2.cloudflarestorage.com`,credentials:{accessKeyId:accessKeyId!,secretAccessKey:secretAccessKey!}});}
export const manifestKey="library/manifest.json";
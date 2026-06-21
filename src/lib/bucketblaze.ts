// import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize Backblaze B2 Client using S3 compatibility layer
// const b2Endpoint = process.env.BUCKETBLAZE_ENDPOINT || ""; // e.g. s3.us-west-004.backblazeb2.com
// const b2Region = process.env.BUCKETBLAZE_REGION || "us-west-004";
// const b2KeyId = process.env.BUCKETBLAZE_KEY_ID || "";
// const b2AppKey = process.env.BUCKETBLAZE_APPLICATION_KEY || "";
// const b2BucketName = process.env.BUCKETBLAZE_BUCKET_NAME || "genstack-assets";

// export const s3Client = new S3Client({
//   endpoint: b2Endpoint || undefined,
//   region: b2Region,
//   credentials: {
//     accessKeyId: b2KeyId || "dummy-key",
//     secretAccessKey: b2AppKey || "dummy-secret",
//   },
//   forcePathStyle: true, // Backblaze B2 requires path-style routing
// });

/**
 * Generate a presigned URL to allow browser uploads directly to Backblaze B2.
 * @param fileKey Unique key/path for the file in the bucket (e.g. "logos/user_123/logo.png")
 * @param contentType The MIME type of the file (e.g. "image/png")
 * @param expiresIn duration in seconds (default 3600 / 1 hour)
 */
export async function getUploadPresignedUrl(
  fileKey: string,
  contentType: string,
  expiresIn = 3600
): Promise<{ uploadUrl: string; fileUrl: string }> {
  // BUCKETBLAZE DISCONNECTED - Using Convex File Storage instead.
  // Returning mock fallbacks if called directly.
  console.warn("Bucketblaze is currently disconnected. Use Convex File Storage instead.");
  return {
    uploadUrl: `http://localhost:3000/api/mock-upload?key=${encodeURIComponent(fileKey)}`,
    fileUrl: `http://localhost:3000/mock-assets/${fileKey}`,
  };
}

/**
 * Delete an object from the Backblaze B2 bucket
 * @param fileKey The key of the file to delete (e.g. "logos/user_123/logo.png")
 */
export async function deleteFile(fileKey: string): Promise<boolean> {
  console.warn("Bucketblaze is currently disconnected. Use Convex File Storage instead.");
  return true;
}

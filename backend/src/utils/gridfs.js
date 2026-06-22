import mongoose from "mongoose";

const BUCKET_NAME = "interviews";

/**
 * Get GridFS bucket for interview files (audio, video, PDF)
 */
export function getGridFSBucket() {
  if (!mongoose.connection.db) {
    throw new Error("Database not connected");
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: BUCKET_NAME,
  });
}

/**
 * Upload a buffer to GridFS
 * @returns {Promise<mongoose.Types.ObjectId>} file id
 */
export async function uploadToGridFS(buffer, filename, contentType) {
  const bucket = getGridFSBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: contentType || "application/octet-stream",
      metadata: { uploadedAt: new Date() },
    });

    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.on("error", reject);
    uploadStream.end(buffer);
  });
}

/**
 * Open a read stream for a GridFS file
 */
export function getGridFSReadStream(fileId) {
  const bucket = getGridFSBucket();
  return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
}

/**
 * Delete a file from GridFS (no-op if fileId is null)
 */
export async function deleteFromGridFS(fileId) {
  if (!fileId) {
    return;
  }

  try {
    const bucket = getGridFSBucket();
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
  } catch (error) {
    if (error.code !== "FileNotFound") {
      throw error;
    }
  }
}

/**
 * Replace a GridFS file: delete old, upload new
 */
export async function replaceGridFSFile(oldFileId, buffer, filename, contentType) {
  if (oldFileId) {
    await deleteFromGridFS(oldFileId);
  }
  return uploadToGridFS(buffer, filename, contentType);
}

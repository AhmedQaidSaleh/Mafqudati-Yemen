import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";

export const initCloudinary = () => {
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    console.log("☁️  Cloudinary Initialized");
  } else {
    console.warn("⚠️ Cloudinary credentials missing.");
  }
};

initCloudinary();

export const uploadImage = async (
  fileBuffer: Buffer,
  folder: string = "mafqudati",
): Promise<{ url: string; public_id: string }> => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    const base64 = fileBuffer.toString("base64");
    const dataUri = `data:image/jpeg;base64,${base64}`;
    return {
      url: dataUri,
      public_id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error("Cloudinary returned no result"));
      resolve({ url: result.secure_url, public_id: result.public_id });
    });
    uploadStream.end(fileBuffer);
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

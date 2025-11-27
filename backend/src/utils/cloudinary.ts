// config/cloudinary.ts or utils/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadeOnCloudinary = async (
  localFilePath: string
): Promise<string | null> => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log(
      "file uploaded on cloudinary",
      response.secure_url || response.url
    );

    // once the file is uploaded, delete it from server
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log("🧹 Local file deleted:", localFilePath);
    } else {
      console.warn("⚠️ File not found for deletion:", localFilePath);
    }

    // ✅ return only the URL (string)
    return response.secure_url || response.url || null;
  } catch (error) {
    console.log("cloudinary error", error);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

const deleteFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("deleted from cloudinary", publicId);
    return result;
  } catch (error) {
    console.log("error deleting from cloudinary", error);
    return null;
  }
};

export { uploadeOnCloudinary, deleteFromCloudinary };

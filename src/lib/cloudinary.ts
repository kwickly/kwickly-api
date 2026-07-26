import { v2 as cloudinary } from 'cloudinary';

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn('⚠️ Cloudinary environment variables are not fully configured. Image deletion will be bypassed.');
}

/**
 * Deletes an asset from Cloudinary using its public ID.
 * @param publicId The Cloudinary public ID of the asset to delete
 */
export async function deleteCloudinaryAsset(publicId: string): Promise<boolean> {
  if (!isConfigured) {
    console.warn(`Bypassing deletion of asset "${publicId}" - Cloudinary not configured.`);
    return false;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary asset "${publicId}" deletion result:`, result);
    return result.result === 'ok';
  } catch (error) {
    console.error(`Failed to delete Cloudinary asset "${publicId}":`, error);
    return false;
  }
}

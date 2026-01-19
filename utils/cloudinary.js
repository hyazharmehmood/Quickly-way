import axios from 'axios';

// Get Cloud name from env
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

/**
 * Uploads a file to Cloudinary using Signed Uploads.
 * @param {File | string} file - The file object to upload or a data URL.
 * @param {string} resourceType - 'image', 'video', or 'raw' (default: 'image')
 * @returns {Promise<string>} - The URL of the uploaded file.
 */
export const uploadToCloudinary = async (file, resourceType = 'image') => {
    if (!file) return null;

    // If it's already a URL (not a base64 data url), return it
    if (typeof file === 'string' && file.startsWith('http')) {
        return file;
    }

    try {
        const timestamp = Math.round((new Date()).getTime() / 1000);

        // 1. Get Signature from backend
        const paramsToSign = {
            timestamp: timestamp,
            // folder: 'quicklyway', // Optional: if we want folders
        };

        const signatureResponse = await axios.post('/api/upload/signature', { paramsToSign });
        const { signature } = signatureResponse.data;

        // 2. Determine resource type from file if not provided
        let uploadResourceType = resourceType;
        if (file instanceof File) {
            if (file.type.startsWith('video/')) {
                uploadResourceType = 'video';
            } else if (file.type.startsWith('image/')) {
                uploadResourceType = 'image';
            } else {
                uploadResourceType = 'raw'; // For other file types
            }
        }

        // 3. Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', API_KEY);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        // formData.append('folder', 'quicklyway');

        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${uploadResourceType}/upload`,
            formData
        );

        return response.data.secure_url;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        throw new Error("File upload failed");
    }
};

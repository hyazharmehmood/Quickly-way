import axios from 'axios';

// Get Cloud name from env
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

/**
 * Uploads a file to Cloudinary using Signed Uploads.
 * @param {File | string} file - The file object to upload or a data URL.
 * @returns {Promise<string>} - The URL of the uploaded image.
 */
export const uploadToCloudinary = async (file) => {
    if (!file) return null;

    // If it's already a URL (not a base64 data url), return it
    if (typeof file === 'string' && file.startsWith('http')) {
        return file;
    }

    try {
        const timestamp = Math.round((new Date()).getTime() / 1000);

        // 1. Get Signature from backend
        // We need to sign: timestamp so we send timestamp to backend to include in signature
        // Actually, logic: Frontend chooses timestamp, sends to backend. Backend returns signature.
        const paramsToSign = {
            timestamp: timestamp,
            // folder: 'quicklyway', // Optional: if we want folders
        };

        const signatureResponse = await axios.post('/api/upload/signature', { paramsToSign });
        const { signature } = signatureResponse.data;

        // 2. Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', API_KEY);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        // formData.append('folder', 'quicklyway');

        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            formData
        );

        return response.data.secure_url;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        throw new Error("Image upload failed");
    }
};

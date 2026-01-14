import { NextResponse } from 'next/server';
import crypto from 'crypto';

const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export async function POST(request) {
    try {
        if (!API_SECRET) {
            return NextResponse.json({ message: 'Missing API Secret' }, { status: 500 });
        }

        const { paramsToSign } = await request.json();

        // Sort keys
        const sortedKeys = Object.keys(paramsToSign).sort();

        // Create query string: key=value&key2=value2
        // Note: CLoudinary expects values to be present.
        const stringToSign = sortedKeys.map(key => `${key}=${paramsToSign[key]}`).join('&');

        // Append secret
        const toSign = stringToSign + API_SECRET;

        // SHA1 hash
        const signature = crypto.createHash('sha1').update(toSign).digest('hex');

        return NextResponse.json({ signature }, { status: 200 });

    } catch (error) {
        console.error("Signature generation error:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

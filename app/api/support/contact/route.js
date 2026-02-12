import { NextResponse } from 'next/server';
import { sendContactSupportEmail } from '@/lib/utils/email';

export async function POST(request) {
    try {
        const body = await request.json();
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        const description = typeof body.description === 'string' ? body.description.trim() : '';

        if (!name || !email || !description) {
            return NextResponse.json(
                { success: false, error: 'Name, email and message are required.' },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Please enter a valid email address.' },
                { status: 400 }
            );
        }

        await sendContactSupportEmail(name, email, description);

        return NextResponse.json(
            { success: true, message: 'Message sent. We will get back to you soon.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Support contact error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send message. Please try again later.' },
            { status: 500 }
        );
    }
}

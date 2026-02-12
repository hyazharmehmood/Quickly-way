import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_9nFNZ2pR_Q8RDm17uBj9axve1CgQUd7pD';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Quicklyway <onboarding@resend.dev>';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'tahirhameed@yahoo.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const resend = new Resend(RESEND_API_KEY);

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetUrl, userName) => {
    try {
        const result = await resend.emails.send({
            from: EMAIL_FROM,
            to: [email],
            subject: 'Reset Your Password - Quicklyway',
            html: getPasswordResetEmailTemplate(resetUrl, userName),
        });
        return result;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
};

/**
 * Send contact support form email to support inbox
 */
export const sendContactSupportEmail = async (name, email, description) => {
    try {
        const result = await resend.emails.send({
            from: EMAIL_FROM,
            to: [SUPPORT_EMAIL],
            replyTo: email,
            subject: `Contact Us: ${name} - Quicklyway`,
            html: getContactSupportEmailTemplate(name, email, description),
        });
        return result;
    } catch (error) {
        console.error('Error sending contact support email:', error);
        throw error;
    }
};

/**
 * HTML email template for contact support
 */
const getContactSupportEmailTemplate = (name, email, description) => {
    const safeName = (name || 'Someone').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeEmail = (email || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeDesc = (description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Us - Quicklyway</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
                    <h1 style="color: #10b981; margin: 0; font-size: 28px;">Quicklyway – Contact Us</h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px 20px; background-color: #f5f5f5;">
                    <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">New message from website</h2>
                                <p style="color: #666666; font-size: 16px; margin: 0 0 8px 0;"><strong>Name:</strong> ${safeName}</p>
                                <p style="color: #666666; font-size: 16px; margin: 0 0 20px 0;"><strong>Email:</strong> ${safeEmail}</p>
                                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;"><strong>Message:</strong></p>
                                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 10px 0 0 0;">${safeDesc}</p>
                                <p style="color: #999999; font-size: 14px; margin: 30px 0 0 0;">You can reply directly to this email to respond to ${safeName}.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

/**
 * HTML email template for password reset
 */
const getPasswordResetEmailTemplate = (resetUrl, userName) => {
    const name = userName || 'User';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
                    <h1 style="color: #10b981; margin: 0; font-size: 28px;">Quicklyway</h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px 20px; background-color: #f5f5f5;">
                    <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
                                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                    Hello ${name},
                                </p>
                                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                    We received a request to reset your password for your Quicklyway account. Click the button below to reset your password. This link will expire in 1 hour.
                                </p>
                                <table role="presentation" style="width: 100%; margin: 30px 0;">
                                    <tr>
                                        <td style="text-align: center;">
                                            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
                                                Reset Password
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                    If the button doesn't work, copy and paste this link into your browser:
                                </p>
                                <p style="color: #10b981; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
                                    ${resetUrl}
                                </p>
                                <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                    If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                                </p>
                                <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                    Best regards,<br>
                                    The Quicklyway Team
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding: 20px; text-align: center; background-color: #f5f5f5;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} Quicklyway. All rights reserved.
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

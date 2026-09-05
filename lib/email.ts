import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<boolean> {
  const fromAddress = process.env.SMTP_FROM || `"CITK Hostel Management" <${process.env.SMTP_USER}>`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f4; margin: 0; padding: 20px; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #d7e6d0; }
          .header { background-color: #2e7d32; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
          .header p { margin: 5px 0 0; font-size: 13px; opacity: 0.9; }
          .body { padding: 30px 24px; color: #333333; line-height: 1.6; }
          .otp-box { background: #e8f5e9; border: 2px dashed #2e7d32; border-radius: 8px; text-align: center; padding: 20px; margin: 24px 0; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1b5e20; margin: 0; font-family: monospace; }
          .expiry { font-size: 13px; color: #666666; margin-top: 8px; }
          .footer { background-color: #f9fbf9; padding: 16px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CITK HOSTEL PORTAL</h1>
            <p>Central Institute of Technology Kokrajhar</p>
          </div>
          <div class="body">
            <h2 style="font-size: 18px; color: #2e7d32; margin-top: 0;">Email Verification Code</h2>
            <p>Hello,</p>
            <p>Thank you for signing up for the CITK Hostel Management System. Please use the following 6-digit verification code to complete your registration:</p>
            <div class="otp-box">
              <div class="otp-code">${otpCode}</div>
              <div class="expiry">Valid for 10 minutes</div>
            </div>
            <p style="font-size: 13px; color: #555;">If you did not request this verification code, please ignore this email or contact the hostel administration.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} CITK Hostel Management System. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: `CITK Hostel Portal - Your Verification Code: ${otpCode}`,
    html: htmlContent,
    text: `Your CITK Hostel Portal verification code is: ${otpCode}. It is valid for 10 minutes.`,
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Failed to send OTP email via SMTP:', error)
    // If SMTP credentials are dummy/placeholder during local testing, log gracefully
    return false
  }
}

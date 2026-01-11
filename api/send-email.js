import { Resend } from 'resend';

const resend = new Resend(process.env.VITE_RESEND_API_KEY);

export default async function handler(req, res) {
  try {
    const { email, type, data, attachments } = req.body;

    let subject = "";
    let htmlContent = "";
    // default sender for invoices
    let fromAddress = 'Aidezel Orders <orders@aidezel.co.uk>'; 

    // === 1. INVOICE HANDLING ===
    if (type === 'invoice') {
      subject = `Invoice #${data.orderId} from Aidezel`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #000;">Thank you for your order!</h2>
          <p>Hello <b>${data.name}</b>,</p>
          <p>Please find your official tax invoice attached to this email.</p>
          <p style="font-size: 18px; font-weight: bold;">Order Total: £${data.total}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">
            © 2026 Aidezel Inc.<br/>
            <a href="https://aidezel.co.uk" style="color: #888; text-decoration: none;">www.aidezel.co.uk</a>
          </p>
        </div>
      `;
    }

    // === 2. OTP HANDLING (Legacy/Manual Fallback) ===
    // Note: Supabase now handles this automatically via SMTP!
    // You likely don't need this block anymore, but I kept it just in case.
    else if (type === 'otp') {
      fromAddress = 'Aidezel Security <noreply@aidezel.co.uk>'; // Use noreply for security codes
      subject = 'Verify your Aidezel Account';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Verify your account</h2>
          <p>Your verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">${data.code}</div>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `;
    }

    // === SEND EMAIL ===
    const response = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: subject,
      html: htmlContent,
      attachments: attachments, 
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('Email Error:', error); // Log error for Vercel logs
    return res.status(500).json({ error: error.message });
  }
}
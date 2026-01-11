import { Resend } from 'resend';

const resend = new Resend(process.env.VITE_RESEND_API_KEY);

export default async function handler(req, res) {
  try {
    const { email, type, data, attachments } = req.body; // <--- Added 'attachments'

    let subject = "";
    let htmlContent = "";

    // === 1. LOGIN OTP ===
    if (type === 'otp') {
      subject = 'Verify your Aidezel Account';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Verify your account</h2>
          <p>Your code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${data.code}</div>
        </div>
      `;
    }

    // === 2. INVOICE (Simple Body, PDF is attached) ===
    else if (type === 'invoice') {
      subject = `Invoice #${data.orderId} from Aidezel`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Thank you for your order!</h2>
          <p>Hello <b>${data.name}</b>,</p>
          <p>Please find your official tax invoice attached to this email.</p>
          <p><b>Order Total: ₹${data.total}</b></p>
          <br/>
          <p style="font-size: 12px; color: #888;">© 2026 Aidezel Inc.</p>
        </div>
      `;
    }

    // === SEND EMAIL ===
    const response = await resend.emails.send({
      from: 'Aidezel Orders <orders@aidezel.co.uk>',
      to: [email],
      subject: subject,
      html: htmlContent,
      attachments: attachments, // <--- This attaches the PDF
    });

    return res.status(200).json(response);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
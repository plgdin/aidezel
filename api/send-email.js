import { Resend } from 'resend';

const resend = new Resend(process.env.VITE_RESEND_API_KEY);

export default async function handler(req, res) {
  try {
    const { email, type, data, attachments } = req.body;

    // === SAFETY CHECK ===
    // If the frontend tries to send an OTP, we BLOCK it here.
    // This prevents the "Double Email" issue immediately.
    if (type === 'otp') {
      console.log('Blocked manual OTP email. Supabase handles this automatically now.');
      return res.status(200).json({ message: 'Skipped: OTP handled by Supabase SMTP' });
    }

    // === INVOICE HANDLING ONLY ===
    if (type === 'invoice') {
      const subject = `Invoice #${data.orderId} from Aidezel`;
      const htmlContent = `
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

      // Send the Invoice
      const response = await resend.emails.send({
        from: 'Aidezel Orders <orders@aidezel.co.uk>',
        to: [email],
        subject: subject,
        html: htmlContent,
        attachments: attachments,
      });

      return res.status(200).json(response);
    }

    // Handle unknown types
    return res.status(400).json({ error: 'Invalid email type requested' });

  } catch (error) {
    console.error('Email Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
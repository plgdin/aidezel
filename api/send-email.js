import { Resend } from 'resend';

// CRITICAL: Check all possible key names used by Vercel/Netlify/Vite
const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY;

const resend = apiKey ? new Resend(apiKey) : null;

export default async function handler(req, res) {
  // 1. Debugging: Check if API Key exists (Don't log the actual key for security)
  if (!resend) {
    console.error("❌ CRITICAL: No 'RESEND_API_KEY' found in environment variables.");
    return res.status(500).json({ error: 'Server Config Error: API Key Missing' });
  }

  try {
    const { email, type, data, attachments } = req.body;

    console.log(`📩 [Email API] Request received for type: '${type}' to: ${email}`);

    // === SAFETY CHECK (OTP) ===
    if (type === 'otp') {
      return res.status(200).json({ message: 'Skipped: OTP handled by Supabase SMTP' });
    }

    // === INVOICE HANDLING ===
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

      // Attempt Send
      const response = await resend.emails.send({
        from: 'Aidezel Orders <orders@aidezel.co.uk>', // Ensure this domain is verified in Resend dashboard
        to: [email],
        subject: subject,
        html: htmlContent,
        attachments: attachments,
      });

      if (response.error) {
        console.error("❌ [Resend API Error]:", response.error);
        return res.status(500).json({ error: response.error.message });
      }

      console.log(`✅ [Email API] Success! Email ID: ${response.data?.id}`);
      return res.status(200).json(response);
    }

    return res.status(400).json({ error: 'Invalid email type requested' });

  } catch (error) {
    console.error('💥 [Email API] Critical Failure:', error);
    return res.status(500).json({ error: error.message });
  }
}
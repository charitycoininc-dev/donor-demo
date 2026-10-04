import { Resend } from "resend";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check if RESEND_API_KEY is set
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set in environment variables");
    return res.status(500).json({
      error: "Email service is not configured. Please contact support.",
      details: "RESEND_API_KEY environment variable is missing",
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Send notification email to Michael Evans
    const notificationEmailTo = "Michael.Evans@TheBlackHistoryFoundation.org";
    console.log(`Attempting to send notification email to ${notificationEmailTo}`);
    
    let notificationEmail;
    try {
      notificationEmail = await resend.emails.send({
        from: "Charity Coin <Info@thecpi.network>",
        to: notificationEmailTo,
        subject: `New Contact Form Submission: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B1A1A;">New Contact Form Submission</h2>
            <p>You have received a new message through the Charity Coin contact form:</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This email was sent from the Charity Coin contact form.
            </p>
          </div>
        `,
      });

      console.log("Notification email response:", {
        id: notificationEmail.data?.id,
        error: notificationEmail.error,
        statusCode: notificationEmail.statusCode,
        fullResponse: JSON.stringify(notificationEmail, null, 2),
      });

      if (notificationEmail.error) {
        console.error("Notification email error details:", notificationEmail.error);
        // Don't throw here - continue to send confirmation email even if notification fails
        console.warn("Warning: Failed to send notification email, but continuing with confirmation email");
      } else if (!notificationEmail.data?.id) {
        console.warn("Warning: Notification email sent but no ID returned. Email may not have been delivered.");
      }
    } catch (notificationError) {
      console.error("Exception while sending notification email:", notificationError);
      // Log but don't throw - we want to try sending the confirmation email anyway
      console.warn("Warning: Exception sending notification email, but continuing with confirmation email");
      notificationEmail = { error: notificationError.message, data: null };
    }

    // Send confirmation email to the submitter
    console.log(`Attempting to send confirmation email to ${email}`);
    const confirmationEmail = await resend.emails.send({
      from: "Charity Coin <Info@thecpi.network>",
      to: email,
      subject: "Thank You for Contacting The Black History Foundation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B1A1A;">Thank You for Contacting Us</h2>
          <p>Dear ${name},</p>
          <p>Thank you for reaching out to The Black History Foundation. We have received your message and will respond within two business days.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Your Message:</strong></p>
            <p style="white-space: pre-wrap; margin-top: 10px;">${message}</p>
          </div>
          
          <p>If you have any urgent questions, please feel free to contact us directly at 
            <a href="mailto:Info@TheBlackHistoryFoundation.org" style="color: #D4AF37;">
              Info@TheBlackHistoryFoundation.org
            </a>.
          </p>
          
          <p>Best regards,<br>The Black History Foundation Team</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated confirmation email. Please do not reply to this message.
          </p>
        </div>
      `,
    });

    console.log("Confirmation email response:", {
      id: confirmationEmail.data?.id,
      error: confirmationEmail.error,
      fullResponse: confirmationEmail,
    });

    if (confirmationEmail.error) {
      throw new Error(`Failed to send confirmation email: ${confirmationEmail.error.message || JSON.stringify(confirmationEmail.error)}`);
    }

    // Return success even if notification email failed, but include warning
    const response = {
      success: true,
      message: notificationEmail.error 
        ? "Confirmation email sent, but notification email failed. Check logs for details."
        : "Emails sent successfully",
      notificationEmailId: notificationEmail.data?.id || null,
      confirmationEmailId: confirmationEmail.data?.id || null,
      notificationEmailError: notificationEmail.error ? notificationEmail.error.message || JSON.stringify(notificationEmail.error) : null,
    };

    if (notificationEmail.error) {
      console.error("Returning response with notification email error:", response);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error sending emails:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return res.status(500).json({
      error: "Failed to send emails",
      details: error.message,
      // Include more details in development
      ...(process.env.NODE_ENV === "development" && {
        name: error.name,
        stack: error.stack,
      }),
    });
  }
}


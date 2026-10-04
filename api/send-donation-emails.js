import { Resend } from "resend";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env.local in development
// Vercel automatically loads .env.local in production, but we need to load it manually in local dev
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  dotenv.config({ path: join(__dirname, '..', '.env.local') });
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check if RESEND_API_KEY is set
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailDisabled = !resendApiKey;
  if (emailDisabled) {
    console.warn("[DonationEmails] RESEND_API_KEY missing. Emails will be skipped.");
  }

  const resend = emailDisabled ? null : new Resend(resendApiKey);

  try {
    const { 
      type, // 'initial', 'approved', or 'rejected'
      donorEmail,
      donorName,
      donationAmount,
      nonprofitName,
      donationId,
      // For approved donations only:
      totalDonated,
      taxDeductibleAmount,
      charityCoinsEarned,
      raffleEntriesEarned,
      sweepstakesEntriesEarned,
      // For initial and approved donations:
      isRaffleEligible,
    } = req.body;

    // Validate required fields
    if (!type || !donorEmail || !donationAmount || !nonprofitName) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["type", "donorEmail", "donationAmount", "nonprofitName"]
      });
    }

    const results = {};

    if (emailDisabled) {
      console.warn(`[DonationEmails] Skipping email send for type "${type}" because email service is not configured.`);
      return res.status(200).json({
        success: false,
        skipped: true,
        message: "Email service not configured. RESEND_API_KEY missing.",
      });
    }

    if (type === "initial") {
      // Send admin notification email
      const adminEmail = "helpkeepmymoney@gmail.com";
      console.log(`[DonationEmails] Sending admin notification to ${adminEmail}`);
      
      try {
        const adminNotification = await resend.emails.send({
          from: "Charity Coin <Info@thecpi.network>",
          to: adminEmail,
          subject: `New Donation Received: ${formatCurrency(donationAmount)}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8B1A1A;">New Donation Received</h2>
              <p>A new donation has been submitted and is pending approval:</p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Donor:</strong> ${donorName || donorEmail}</p>
                <p><strong>Email:</strong> ${donorEmail}</p>
                <p><strong>Amount:</strong> ${formatCurrency(donationAmount)}</p>
                <p><strong>Nonprofit:</strong> ${nonprofitName}</p>
                <p><strong>Donation ID:</strong> ${donationId || 'N/A'}</p>
                <p><strong>Status:</strong> <span style="color: #D4AF37; font-weight: bold;">Pending Approval</span></p>
              </div>
              <p style="margin-top: 20px;">
                <a href="https://charity-coin-2.vercel.app/admin/data" 
                   style="background-color: #8B1A1A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Review Donation
                </a>
              </p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This email was sent from the Charity Coin donation system.
              </p>
            </div>
          `,
        });

        results.adminNotificationId = adminNotification.data?.id || null;
        results.adminNotificationError = adminNotification.error ? 
          (adminNotification.error.message || JSON.stringify(adminNotification.error)) : null;

        if (adminNotification.error) {
          console.error("Admin notification email error:", adminNotification.error);
        }
      } catch (adminError) {
        console.error("Exception sending admin notification:", adminError);
        results.adminNotificationError = adminError.message;
      }

      // Send initial confirmation email to donor
      console.log(`[DonationEmails] Sending initial confirmation to ${donorEmail}`);
      try {
        const initialConfirmation = await resend.emails.send({
          from: "Charity Coin <Info@thecpi.network>",
          to: donorEmail,
          subject: "Thank You for Your Donation - Processing",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8B1A1A;">Thank You for Your Donation!</h2>
              <p>Dear ${donorName || 'Valued Donor'},</p>
              <p>We have received your donation request and it is currently being processed.</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Donation Amount:</strong> ${formatCurrency(donationAmount)}</p>
                <p><strong>Nonprofit:</strong> ${nonprofitName}</p>
                <p><strong>Status:</strong> <span style="color: #D4AF37; font-weight: bold;">Pending Approval</span></p>
              </div>
              
              <p>Your donation is being reviewed by our team. Once approved, you will receive a second confirmation email with:</p>
              <ul style="margin: 15px 0; padding-left: 25px;">
                <li>Your total donation amount</li>
                <li>The tax-deductible portion of your donation</li>
                <li>The number of Charity Coins and ${(isRaffleEligible !== false) ? 'raffle entries' : 'sweepstake entries'} you've earned</li>
              </ul>
              
              <p>If you have any questions, please contact us at 
                <a href="mailto:Info@TheBlackHistoryFoundation.org" style="color: #D4AF37;">
                  Info@TheBlackHistoryFoundation.org
                </a>.
              </p>
              
              <p>Thank you for supporting The Black History Foundation!</p>
              <p>Best regards,<br>The Black History Foundation Team</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #666; font-size: 12px;">
                This is an automated confirmation email. Please do not reply to this message.
              </p>
            </div>
          `,
        });

        results.initialConfirmationId = initialConfirmation.data?.id || null;
        results.initialConfirmationError = initialConfirmation.error ? 
          (initialConfirmation.error.message || JSON.stringify(initialConfirmation.error)) : null;

        if (initialConfirmation.error) {
          console.error("[DonationEmails] Initial confirmation email error:", initialConfirmation.error);
          // Don't throw - continue and return partial success
        }
      } catch (initialError) {
        console.error("[DonationEmails] Exception sending initial confirmation:", initialError);
        results.initialConfirmationError = initialError.message;
        // Don't throw - continue and return partial success
      }

    } else if (type === "approved") {
      // Validate required fields for approved donations
      if (totalDonated === undefined || taxDeductibleAmount === undefined || 
          charityCoinsEarned === undefined) {
        return res.status(400).json({ 
          error: "Missing required fields for approved donation",
          required: ["totalDonated", "taxDeductibleAmount", "charityCoinsEarned"]
        });
      }
      
      // Determine if this is a raffle-eligible or sweepstakes-eligible donation
      const isRaffle = isRaffleEligible !== false; // Default to true for backward compatibility
      const entriesEarned = isRaffle ? (raffleEntriesEarned || charityCoinsEarned) : (sweepstakesEntriesEarned || Math.floor(totalDonated));
      const entryType = isRaffle ? "Raffle Entries" : "Sweepstakes Entries";

      // Send final confirmation email to donor
      console.log(`[DonationEmails] Sending approval confirmation to ${donorEmail}`);
      const approvalConfirmation = await resend.emails.send({
        from: "Charity Coin <Info@thecpi.network>",
        to: donorEmail,
        subject: "Your Donation Has Been Approved - Thank You!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B1A1A;">Your Donation Has Been Approved!</h2>
            <p>Dear ${donorName || 'Valued Donor'},</p>
            <p>Thank you for your generous donation! Your contribution has been processed and approved.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #8B1A1A; margin-top: 0;">Donation Summary</h3>
              <p><strong>Total Donation Amount:</strong> ${formatCurrency(totalDonated)}</p>
              <p><strong>Tax-Deductible Amount:</strong> ${formatCurrency(taxDeductibleAmount)} ${isRaffle ? '(50%)' : '(100%)'}</p>
              <p><strong>Nonprofit:</strong> ${nonprofitName}</p>
            </div>
            
            <div style="background-color: #D4AF37; color: #8B1A1A; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #8B1A1A; margin-top: 0;">Your Rewards</h3>
              <p style="font-size: 18px; margin: 10px 0;"><strong>Charity Coins Earned:</strong> ${charityCoinsEarned.toLocaleString()}</p>
              <p style="font-size: 18px; margin: 10px 0;"><strong>${entryType} Earned:</strong> ${entriesEarned.toLocaleString()}</p>
            </div>
            
            ${isRaffle 
              ? `<div style="background-color: #fff3cd; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 13px; line-height: 1.6;">
                    <strong>Legal Disclaimer:</strong> Your raffle entries are subject to the laws of your local jurisdiction. 
                    If entry into the raffle is not allowed by your jurisdiction, then your raffle entries are void where prohibited 
                    and 100% of your donation is tax-deductible.
                  </p>
                </div>`
              : `<div style="background-color: #e7f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 13px; line-height: 1.6;">
                    <strong>Important Notice:</strong> 50/50 raffles are not allowed in your state. Your donation has been processed as a non-raffle-eligible donation. 
                    You have received sweepstakes entries instead of raffle entries, and your donation is 100% tax-deductible.
                  </p>
                </div>`
            }
            
            <p>You can view your donation history and track your Charity Coins in your 
              <a href="https://charity-coin-2.vercel.app/wallet" style="color: #D4AF37;">wallet</a>.
            </p>
            
            <p>Thank you for supporting The Black History Foundation and making a difference in our community!</p>
            <p>Best regards,<br>The Black History Foundation Team</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              This is an automated confirmation email. Please do not reply to this message.<br>
              For questions, contact: <a href="mailto:Info@TheBlackHistoryFoundation.org" style="color: #8B1A1A;">Info@TheBlackHistoryFoundation.org</a>
            </p>
          </div>
        `,
      });

      results.approvalConfirmationId = approvalConfirmation.data?.id || null;
      if (approvalConfirmation.error) {
        throw new Error(`Failed to send approval confirmation email: ${approvalConfirmation.error.message || JSON.stringify(approvalConfirmation.error)}`);
      }
    } else if (type === "rejected") {
      const rejectionReason = req.body.rejectionReason || "Your donation could not be approved at this time.";
      console.log(`[DonationEmails] Sending rejection notice to ${donorEmail}`);
      const rejectionEmail = await resend.emails.send({
        from: "Charity Coin <Info@thecpi.network>",
        to: donorEmail,
        subject: "Update On Your Donation Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B1A1A;">Donation Update</h2>
            <p>Dear ${donorName || 'Valued Donor'},</p>
            <p>Thank you for your generosity and for submitting a donation in support of ${nonprofitName}.</p>
            <p>After review, we’re unable to approve this donation and it has been cancelled. No funds were captured, and no Charity Coins or raffle entries were issued.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Donation Amount:</strong> ${formatCurrency(donationAmount)}</p>
              <p><strong>Nonprofit:</strong> ${nonprofitName}</p>
              <p><strong>Status:</strong> <span style="color: #8B1A1A; font-weight: bold;">Not Approved</span></p>
            </div>
            
            <p><strong>Reason provided:</strong> ${rejectionReason}</p>
            
            <p>If you have questions or would like help submitting a new donation, please reach out to us at 
              <a href="mailto:Info@TheBlackHistoryFoundation.org" style="color: #D4AF37;">
                Info@TheBlackHistoryFoundation.org
              </a>.
            </p>
            
            <p>We appreciate your support of The Black History Foundation and hope to partner with you again soon.</p>
            <p>Warm regards,<br>The Black History Foundation Team</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              This is an automated notification. Please do not reply to this message.
            </p>
          </div>
        `,
      });
      results.rejectionEmailId = rejectionEmail.data?.id || null;
      if (rejectionEmail.error) {
        throw new Error(`Failed to send rejection email: ${rejectionEmail.error.message || JSON.stringify(rejectionEmail.error)}`);
      }
    } else {
      return res.status(400).json({ error: "Invalid type. Must be 'initial', 'approved', or 'rejected'" });
    }

    // Determine overall success - consider it successful if at least one email was sent
    const hasSuccess = type === "initial" 
      ? (results.adminNotificationId || results.initialConfirmationId)
      : results.approvalConfirmationId;
    
    const hasErrors = type === "initial"
      ? (results.adminNotificationError || results.initialConfirmationError)
      : false;

    return res.status(hasSuccess ? 200 : 500).json({
      success: !!hasSuccess,
      message: type === "initial" 
        ? (hasSuccess 
          ? (hasErrors ? "Emails sent with some errors" : "Initial confirmation and admin notification emails sent")
          : "Failed to send emails")
        : (hasSuccess ? "Approval confirmation email sent" : "Failed to send approval confirmation email"),
      ...results,
    });

  } catch (error) {
    console.error("[DonationEmails] Error:", error);
    console.error("[DonationEmails] Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return res.status(500).json({
      error: "Failed to send donation emails",
      details: error.message,
      ...(process.env.NODE_ENV === "development" && {
        name: error.name,
        stack: error.stack,
      }),
    });
  }
}

// Helper function to format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}


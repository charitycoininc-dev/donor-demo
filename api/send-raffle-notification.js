import { Resend } from "resend";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  dotenv.config({ path: join(__dirname, "..", ".env.local") });
}

const ADMIN_EMAIL = "helpkeepmymoney@gmail.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailDisabled = !resendApiKey;

  if (emailDisabled) {
    console.warn(
      "[RaffleNotification] RESEND_API_KEY missing. Skipping admin notification.",
    );
    return res.status(200).json({
      success: false,
      skipped: true,
      message: "Email service not configured.",
    });
  }

  const resend = new Resend(resendApiKey);

  try {
    const {
      raffleId,
      status = "pending",
      prizePool,
      winningCoinNumber,
      winnerWallet,
      randomnessMethod,
      triggeredBy = "automated",
      note = "",
    } = req.body || {};

    if (!prizePool || !winningCoinNumber) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["prizePool", "winningCoinNumber"],
      });
    }

    const subjectStatus =
      status === "pending"
        ? "Pending Review"
        : status === "finalized"
          ? "Finalized"
          : "Rejected";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B1A1A; margin-bottom: 16px;">New Raffle Drawing (${subjectStatus})</h2>
        <p style="margin: 0 0 16px 0;">A raffle drawing has been conducted and requires your review.</p>
        <div style="background-color: #f8f8f8; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <p style="margin: 4px 0;"><strong>Prize Pool:</strong> $${Number(prizePool).toLocaleString()}</p>
          <p style="margin: 4px 0;"><strong>Winning Coin Number:</strong> #${winningCoinNumber}</p>
          <p style="margin: 4px 0;"><strong>Winner Wallet:</strong> ${winnerWallet || "N/A"}</p>
          <p style="margin: 4px 0;"><strong>Randomness Method:</strong> ${randomnessMethod || "N/A"}</p>
          <p style="margin: 4px 0;"><strong>Triggered By:</strong> ${triggeredBy}</p>
          <p style="margin: 4px 0;"><strong>Raffle History ID:</strong> ${raffleId || "N/A"}</p>
        </div>
        ${
          note
            ? `<p style="margin: 0 0 16px 0;"><strong>Notes:</strong> ${note}</p>`
            : ""
        }
        <p style="margin-top: 24px;">Please log in to the admin console to complete the required KYC verification.</p>
      </div>
    `;

    const response = await resend.emails.send({
      from: "Charity Coin <Info@thecpi.network>",
      to: ADMIN_EMAIL,
      subject: `[Raffle] ${subjectStatus} - Coin #${winningCoinNumber}`,
      html,
    });

    if (response.error) {
      throw new Error(
        response.error.message || JSON.stringify(response.error, null, 2),
      );
    }

    return res.status(200).json({
      success: true,
      message: "Raffle notification email sent",
      id: response.data?.id || null,
    });
  } catch (error) {
    console.error("[RaffleNotification] Error sending email:", error);
    return res.status(500).json({
      error: "Failed to send raffle notification email",
      details: error.message,
    });
  }
}


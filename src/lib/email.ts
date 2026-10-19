import "server-only";

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM ?? "Momentum <onboarding@resend.dev>";

type InviteEmail = {
  to: string;
  inviterName: string;
  projectName: string;
  url: string;
};

/**
 * Sends the invite email. Never throws: the invite exists either way, and
 * the inviter is also shown the link to share by hand. Without a Resend key
 * (local development) the link is printed to the server console instead.
 */
export async function sendInviteEmail({ to, inviterName, projectName, url }: InviteEmail) {
  const subject = `${inviterName} invited you to ${projectName} on Momentum`;
  const text = `${inviterName} invited you to join "${projectName}" on Momentum.\n\nAccept the invite: ${url}\n\nThe link works for 7 days.`;

  if (!resend) {
    console.info(`[email] RESEND_API_KEY not set. Invite for ${to}: ${url}`);
    return { sent: false };
  }

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    text,
    html: `<p>${escapeHtml(inviterName)} invited you to join <strong>${escapeHtml(projectName)}</strong> on Momentum.</p>
<p><a href="${url}">Accept the invite</a></p>
<p style="color:#79839a">The link works for 7 days. If you weren't expecting this, you can ignore it.</p>`,
  });

  if (error) {
    console.error("[email] Invite email failed:", error.message);
    return { sent: false };
  }
  return { sent: true };
}

// Names and project names are user input: never put them in HTML unescaped
function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

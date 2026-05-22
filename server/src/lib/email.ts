export interface OutboundEmail {
  to: string;
  toName: string;
  subject: string;
  body: string;
}

// TODO: replace with a real provider (Postmark, Resend, SendGrid, etc.)
export async function sendEmail(email: OutboundEmail): Promise<void> {
  console.log("[email:outbound]", JSON.stringify(email, null, 2));
}

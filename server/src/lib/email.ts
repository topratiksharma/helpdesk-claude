import sgMail from "@sendgrid/mail";

export interface OutboundEmail {
  to: string;
  toName: string;
  subject: string;
  body: string;
  html?: string;
}

export async function sendEmail(email: OutboundEmail): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const fromName = process.env.SENDGRID_FROM_NAME ?? "Helpdesk";

  if (!apiKey) throw new Error("SENDGRID_API_KEY is not set");
  if (!fromEmail) throw new Error("SENDGRID_FROM_EMAIL is not set");

  sgMail.setApiKey(apiKey);

  await sgMail.send({
    to: { name: email.toName, email: email.to },
    from: { name: fromName, email: fromEmail },
    subject: email.subject,
    text: email.body,
    ...(email.html && { html: email.html }),
  });
}

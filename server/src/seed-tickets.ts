import "dotenv/config";
import { TicketStatus, TicketCategory, MessageSender } from "./generated/prisma";
import { prisma } from "./lib/prisma";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const tickets: Array<{
  subject: string;
  fromName: string;
  fromEmail: string;
  status: TicketStatus;
  category: TicketCategory;
  createdAt: Date;
  messages: Array<{ body: string; sender: MessageSender; offsetMinutes: number }>;
}> = [
  // --- REFUND tickets ---
  {
    subject: "Request refund for duplicate charge",
    fromName: "Alice Thompson",
    fromEmail: "alice.thompson@gmail.com",
    status: TicketStatus.resolved,
    category: TicketCategory.refund,
    createdAt: daysAgo(120),
    messages: [
      { body: "Hi, I was charged twice for my subscription on March 1st. Order #10234 and #10235 are duplicates. Please refund the second charge of $49.99.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Alice, I can confirm the duplicate charge. I've issued a full refund of $49.99 to your card. It should appear within 3-5 business days.", sender: MessageSender.agent, offsetMinutes: 90 },
    ],
  },
  {
    subject: "Charged after cancellation",
    fromName: "Marcus Rivera",
    fromEmail: "marcus.rivera@outlook.com",
    status: TicketStatus.resolved,
    category: TicketCategory.refund,
    createdAt: daysAgo(110),
    messages: [
      { body: "I cancelled my account on Feb 15th but was still charged $29.99 on March 1st. I have the cancellation confirmation email. Please refund immediately.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Thank you for bringing this to our attention, Marcus. I've verified your cancellation date and processed a full refund. Sorry for the inconvenience.", sender: MessageSender.agent, offsetMinutes: 120 },
    ],
  },
  {
    subject: "Product not as described — want my money back",
    fromName: "Priya Patel",
    fromEmail: "priya.patel@yahoo.com",
    status: TicketStatus.closed,
    category: TicketCategory.refund,
    createdAt: daysAgo(105),
    messages: [
      { body: "The analytics dashboard I purchased does not have the real-time features advertised on your website. I want a full refund of $199.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Priya, I've reviewed your account and can see the plan you're on doesn't include real-time analytics — that's a higher tier. I'll issue a refund and can offer you the correct plan at a discount if you'd like.", sender: MessageSender.agent, offsetMinutes: 60 },
      { body: "Thank you for the refund. I'll think about upgrading later.", sender: MessageSender.customer, offsetMinutes: 200 },
    ],
  },
  {
    subject: "Annual plan refund — switching to competitor",
    fromName: "James O'Brien",
    fromEmail: "james.obrien@protonmail.com",
    status: TicketStatus.open,
    category: TicketCategory.refund,
    createdAt: daysAgo(3),
    messages: [
      { body: "I signed up for the annual plan 10 days ago but have decided to go with a different provider. I'd like a pro-rated refund for the unused months.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Refund for failed payment retried successfully",
    fromName: "Sophia Chen",
    fromEmail: "sophia.chen@icloud.com",
    status: TicketStatus.resolved,
    category: TicketCategory.refund,
    createdAt: daysAgo(88),
    messages: [
      { body: "My payment failed last week and I updated my card, but you retried and charged me twice — once on the old card (which now went through) and once on the new card.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Sophia, I can confirm two charges. I've refunded the older charge of $29.99. The new card charge is your legitimate subscription payment.", sender: MessageSender.agent, offsetMinutes: 45 },
    ],
  },
  {
    subject: "Wrong plan charged — need refund difference",
    fromName: "David Kim",
    fromEmail: "david.kim@gmail.com",
    status: TicketStatus.open,
    category: TicketCategory.refund,
    createdAt: daysAgo(1),
    messages: [
      { body: "I downgraded from Pro to Starter last month but was still billed the Pro price of $79. The Starter plan should be $29. Please refund the $50 difference.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Accidental upgrade refund request",
    fromName: "Emily Watson",
    fromEmail: "emily.watson@hotmail.com",
    status: TicketStatus.resolved,
    category: TicketCategory.refund,
    createdAt: daysAgo(72),
    messages: [
      { body: "I accidentally clicked upgrade to Enterprise tier. I didn't mean to do this and haven't used any Enterprise features. Please downgrade and refund the difference.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "No problem Emily! I've downgraded you back to Pro and issued a refund of $120 for the difference. Watch out for that button!", sender: MessageSender.agent, offsetMinutes: 30 },
    ],
  },
  {
    subject: "Subscription refund — company going out of business",
    fromName: "Robert Nguyen",
    fromEmail: "robert.nguyen@bizmail.com",
    status: TicketStatus.closed,
    category: TicketCategory.refund,
    createdAt: daysAgo(65),
    messages: [
      { body: "Our company is unfortunately shutting down. We have 8 months remaining on our annual subscription. Is there any way to get a partial refund?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Robert, we're sorry to hear that. Per our refund policy, annual plans are non-refundable after 30 days. However, given the circumstances, I've been authorized to offer a 50% refund on remaining months. That would be $240.", sender: MessageSender.agent, offsetMinutes: 180 },
      { body: "That works for us. Thank you for being understanding.", sender: MessageSender.customer, offsetMinutes: 300 },
    ],
  },
  {
    subject: "Charged for extra seats I didn't add",
    fromName: "Fatima Al-Hassan",
    fromEmail: "fatima.alhassan@work.ae",
    status: TicketStatus.open,
    category: TicketCategory.refund,
    createdAt: daysAgo(2),
    messages: [
      { body: "My invoice shows 15 seats but we only have 10 users. I've been billed for 5 extra seats for 3 months. Please investigate and refund the overpayment.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "30-day money back guarantee claim",
    fromName: "Tom Aldridge",
    fromEmail: "tom.aldridge@personal.net",
    status: TicketStatus.resolved,
    category: TicketCategory.refund,
    createdAt: daysAgo(58),
    messages: [
      { body: "I signed up 25 days ago and the product isn't meeting my team's needs. Your website clearly states a 30-day money back guarantee. I'd like to exercise that now.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Tom, absolutely — you're within the 30-day window. Full refund of $149 processed. We're sorry it didn't work out. Is there specific feedback you'd like to share?", sender: MessageSender.agent, offsetMinutes: 60 },
    ],
  },

  // --- TECHNICAL QUESTIONS ---
  {
    subject: "API rate limit hit — 429 errors on bulk import",
    fromName: "Noah Spencer",
    fromEmail: "noah.spencer@devteam.io",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(5),
    messages: [
      { body: "We're getting 429 Too Many Requests when trying to bulk import 50,000 records via your API. We've added delays but still hitting limits. What are your rate limits and can we get them increased?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "SSO login not working after domain change",
    fromName: "Isabella Martinez",
    fromEmail: "i.martinez@techcorp.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(4),
    messages: [
      { body: "We changed our company domain from techcorp.net to techcorp.com last week. Now our SAML SSO is broken and none of our users can log in. Error: 'Assertion consumer service URL mismatch'.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Webhook events not being delivered",
    fromName: "Liam Foster",
    fromEmail: "liam.foster@startup.dev",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(95),
    messages: [
      { body: "Our webhook endpoint has been configured for 3 days but we're not receiving any events. I've verified the endpoint is publicly accessible and returns 200. Status dashboard shows all green.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Liam, I checked your webhook configuration and found the issue — the endpoint URL had a trailing slash which caused signature verification to fail silently. I've removed it and triggered a test event. Did you receive it?", sender: MessageSender.agent, offsetMinutes: 240 },
      { body: "Got it! That was the issue. All events are flowing now. Thank you.", sender: MessageSender.customer, offsetMinutes: 260 },
    ],
  },
  {
    subject: "CSV export contains garbled characters",
    fromName: "Amelia Park",
    fromEmail: "amelia.park@datacompany.kr",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(82),
    messages: [
      { body: "When I export customer data to CSV, Korean and Japanese characters appear as question marks or boxes. The data is correct in the UI. Is this an encoding issue?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Yes, this is a known issue with our CSV export — it was using ASCII encoding. I've escalated this to our engineering team. As a workaround, try opening the CSV in Excel using 'UTF-8' encoding option. A fix is scheduled for our next release.", sender: MessageSender.agent, offsetMinutes: 120 },
    ],
  },
  {
    subject: "Integration with Zapier failing — authentication error",
    fromName: "Oliver Reed",
    fromEmail: "oliver.reed@freelancer.co",
    status: TicketStatus.closed,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(78),
    messages: [
      { body: "I'm trying to connect to Zapier but keep getting 'Invalid API key' errors. I've regenerated my API key three times. The key works fine when I test it directly.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Oliver, the Zapier integration requires a v2 API key, not v1. In your settings, go to API > Keys and generate a key with 'v2 compatibility' enabled. Let me know if that works.", sender: MessageSender.agent, offsetMinutes: 60 },
      { body: "That did it! I didn't realize there were different API key versions. All good now.", sender: MessageSender.customer, offsetMinutes: 90 },
    ],
  },
  {
    subject: "Dashboard not loading — blank white screen",
    fromName: "Charlotte Bennett",
    fromEmail: "charlotte.b@consulting.uk",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(70),
    messages: [
      { body: "Since this morning the dashboard shows a blank white screen after logging in. I've tried Chrome, Firefox, and Safari. Cleared cache and cookies. Other users in our company also affected.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Charlotte, we identified a deployment issue affecting some accounts this morning. It has been rolled back. Please refresh your browser. If you still see the issue, please let us know.", sender: MessageSender.agent, offsetMinutes: 30 },
      { body: "Working now, thank you for the quick fix!", sender: MessageSender.customer, offsetMinutes: 45 },
    ],
  },
  {
    subject: "Two-factor authentication codes not working",
    fromName: "Ethan Brooks",
    fromEmail: "ethan.brooks@securemail.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(6),
    messages: [
      { body: "My TOTP codes from Google Authenticator are being rejected. I set up 2FA last week and it worked for a few days. Now I can't log in at all. Is there a time sync issue?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Data export taking too long — times out",
    fromName: "Mia Johnson",
    fromEmail: "mia.johnson@enterprise.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(7),
    messages: [
      { body: "Exporting our full data set (about 2 million records) times out every time after 30 seconds. We need to export for compliance reasons by end of week. Can you increase the timeout or provide a bulk export method?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Email notifications going to spam",
    fromName: "William Clark",
    fromEmail: "william.clark@smallbiz.com",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(55),
    messages: [
      { body: "All notification emails from your platform are going to my Gmail spam folder. My colleagues at different email providers receive them fine. I've marked as not-spam multiple times but they keep going there.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi William, this can happen with aggressive spam filters. Please add noreply@helpdesk.io to your contacts and whitelist our sending domain. I've also added your email to our high-priority sending list.", sender: MessageSender.agent, offsetMinutes: 90 },
      { body: "Adding to contacts fixed it. Thanks!", sender: MessageSender.customer, offsetMinutes: 200 },
    ],
  },
  {
    subject: "Can't upload files larger than 10MB",
    fromName: "Ava Robinson",
    fromEmail: "ava.robinson@mediaagency.com",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(48),
    messages: [
      { body: "File uploads fail silently for anything over 10MB. No error message, the progress bar just resets. We need to upload video files that are 200-500MB.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Ava, the 10MB limit applies to the Basic plan. Your current plan supports uploads up to 100MB. For files over 100MB, you'd need the Enterprise plan which uses direct S3 upload. Would you like to upgrade?", sender: MessageSender.agent, offsetMinutes: 60 },
    ],
  },
  {
    subject: "Mobile app crashing on iOS 17",
    fromName: "Henry Liu",
    fromEmail: "henry.liu@personal.sg",
    status: TicketStatus.closed,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(42),
    messages: [
      { body: "Your iOS app crashes immediately after updating to iOS 17. I'm using an iPhone 14 Pro. The app worked perfectly on iOS 16. I've uninstalled and reinstalled twice.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Henry, we're aware of this iOS 17 compatibility issue. Our engineering team released a fix in version 3.4.2 of the app. Please update from the App Store and it should resolve the crashes.", sender: MessageSender.agent, offsetMinutes: 180 },
      { body: "Updated and it works perfectly now. Thank you!", sender: MessageSender.customer, offsetMinutes: 200 },
    ],
  },
  {
    subject: "Bulk user import — half the records skipped",
    fromName: "Sofia Andersen",
    fromEmail: "sofia.andersen@hr-company.dk",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(8),
    messages: [
      { body: "I uploaded a CSV with 200 users but only 103 were imported. No error messages were shown. The skipped users don't seem to have anything in common — mix of all departments and roles.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Custom domain SSL certificate expired",
    fromName: "Jack Turner",
    fromEmail: "jack.turner@agency.au",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(1),
    messages: [
      { body: "Our custom domain is showing a certificate error since this morning. Visitors are getting browser security warnings which is killing our business. This needs to be fixed urgently!", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "API returning inconsistent data — pagination bug",
    fromName: "Grace Sullivan",
    fromEmail: "grace.s@techstartup.ca",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(35),
    messages: [
      { body: "When paginating through large result sets using cursor-based pagination, we occasionally get duplicate records across pages and some records are missing entirely. This is making our sync logic unreliable.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Grace, this was a known bug that was introduced in our v2.3 API. The cursor was based on updatedAt which caused issues when records were updated mid-pagination. Fixed in v2.4. Please migrate to the v2.4 API endpoint.", sender: MessageSender.agent, offsetMinutes: 300 },
    ],
  },
  {
    subject: "Single sign-on session expiring too quickly",
    fromName: "Lucas Meyer",
    fromEmail: "lucas.meyer@corporate.de",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(30),
    messages: [
      { body: "Our users are being logged out every 15 minutes even though they're actively using the application. This is very disruptive. We're using SAML SSO. Can the session timeout be extended?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Lucas, I found the issue — your SAML assertions have a 15-minute validity window set on your identity provider side. Please increase the assertion validity period in your IdP settings to match your desired session length.", sender: MessageSender.agent, offsetMinutes: 90 },
    ],
  },
  {
    subject: "Real-time dashboard not updating automatically",
    fromName: "Chloe Adams",
    fromEmail: "chloe.adams@analytics.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(9),
    messages: [
      { body: "The real-time dashboard was updating every 30 seconds but for the past 2 days it hasn't been refreshing. I have to manually reload the page to see new data. Other users in our company have the same issue.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Can't delete team members — permission error",
    fromName: "Ryan Hughes",
    fromEmail: "ryan.hughes@company.com",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(22),
    messages: [
      { body: "I'm an admin but when I try to remove a team member I get 'Insufficient permissions'. This worked fine before. I haven't changed any role settings.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Ryan, this is a bug introduced in our last update where super-admin permissions were not properly migrated. I've reset your permissions. Please log out and back in.", sender: MessageSender.agent, offsetMinutes: 120 },
    ],
  },
  {
    subject: "Slow page loads — taking 8+ seconds",
    fromName: "Zoe Campbell",
    fromEmail: "zoe.campbell@retailchain.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(11),
    messages: [
      { body: "Every page on the platform takes 8-15 seconds to load. Our internet is fine — other sites load instantly. This started 3 days ago and is affecting our entire team's productivity.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "OAuth token not refreshing — users getting logged out",
    fromName: "Samuel Wright",
    fromEmail: "samuel.wright@devshop.nz",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(18),
    messages: [
      { body: "Our OAuth integration stops working after 1 hour — the access token expires and the refresh token isn't being used. We're implementing the refresh token flow as per your docs but it returns 'invalid_grant'.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Samuel, refresh tokens in our system expire after 7 days of inactivity and after being used once. Make sure you're storing the new refresh token returned with each access token refresh — each refresh invalidates the previous refresh token.", sender: MessageSender.agent, offsetMinutes: 60 },
    ],
  },
  {
    subject: "Search returning no results for existing records",
    fromName: "Lily Thompson",
    fromEmail: "lily.t@support-team.com",
    status: TicketStatus.closed,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(14),
    messages: [
      { body: "The search functionality returns zero results even for terms I can see in the list view. For example, searching 'Thompson' finds nothing, but I can see Thompson in the table right in front of me.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Lily, our search index had a sync issue after last weekend's maintenance. I've triggered a re-index of your account's data. Please wait 10 minutes and try again.", sender: MessageSender.agent, offsetMinutes: 30 },
      { body: "Working perfectly now! Thank you.", sender: MessageSender.customer, offsetMinutes: 50 },
    ],
  },

  // --- GENERAL QUESTIONS ---
  {
    subject: "How to add team members to my account",
    fromName: "Benjamin Scott",
    fromEmail: "ben.scott@smallteam.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(100),
    messages: [
      { body: "I've just upgraded to the Team plan. How do I invite other people to join my workspace? I can't find the option anywhere in settings.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Benjamin! Go to Settings > Team > Invite Members. Enter your teammates' email addresses and they'll receive an invitation link. You can also set their role (Admin or Member) during the invite.", sender: MessageSender.agent, offsetMinutes: 45 },
    ],
  },
  {
    subject: "Difference between Pro and Business plans",
    fromName: "Hannah Wilson",
    fromEmail: "hannah.wilson@startup.io",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(94),
    messages: [
      { body: "I'm trying to decide between Pro and Business plans. The pricing page isn't very clear about the specific feature differences. Can someone walk me through the key differences?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Happy to help! Pro includes up to 10 seats, standard integrations, and 50GB storage. Business adds unlimited seats, priority support, custom integrations, 500GB storage, and advanced reporting. What's your team size?", sender: MessageSender.agent, offsetMinutes: 60 },
    ],
  },
  {
    subject: "How to export data before cancelling",
    fromName: "Alexander Brown",
    fromEmail: "alex.brown@movingon.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(87),
    messages: [
      { body: "I'll be cancelling my subscription at the end of the month. What's the best way to export all my data? How long do I have to access my account after cancellation?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "You can export all data from Settings > Data > Full Export. The export includes all your records in CSV and JSON format. After cancellation you have 30-day read-only access to download anything you missed.", sender: MessageSender.agent, offsetMinutes: 90 },
    ],
  },
  {
    subject: "Can I use the service for non-profit organizations?",
    fromName: "Victoria Green",
    fromEmail: "victoria.green@nonprofit.org",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(80),
    messages: [
      { body: "We're a registered non-profit. Do you offer discounted plans for non-profits? We can't afford the standard pricing but love the product and would like to use it.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Victoria, yes! We offer a 50% discount for verified non-profit organizations. Please send us your 501(c)(3) or equivalent documentation and we'll apply the discount to your account.", sender: MessageSender.agent, offsetMinutes: 180 },
    ],
  },
  {
    subject: "What happens to data after account deletion?",
    fromName: "Michael Davis",
    fromEmail: "michael.davis@privacy.eu",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(75),
    messages: [
      { body: "Under GDPR I need to know exactly what happens to our data when we delete our account. Is it immediately deleted? How long is it retained in backups?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Michael, upon account deletion: live data is deleted immediately, backups containing your data are purged within 30 days. We can provide a data deletion certificate upon request. Our full DPA is available at helpdesk.io/legal/dpa.", sender: MessageSender.agent, offsetMinutes: 120 },
    ],
  },
  {
    subject: "Is there a free trial available?",
    fromName: "Emma Taylor",
    fromEmail: "emma.taylor@tryingout.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(68),
    messages: [
      { body: "I want to try the platform before committing. Is there a free trial? I don't see any on the pricing page.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Yes, we offer a 14-day free trial on all plans — no credit card required. Click 'Start Free Trial' on the pricing page and you'll get full access to all Pro features for 14 days.", sender: MessageSender.agent, offsetMinutes: 30 },
    ],
  },
  {
    subject: "Can I change my billing cycle from monthly to annual?",
    fromName: "Daniel Harris",
    fromEmail: "daniel.harris@costcutting.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(62),
    messages: [
      { body: "We'd like to switch from monthly to annual billing to get the 20% discount. How do we make this change? Will it be prorated?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "You can switch in Settings > Billing > Change Plan. When switching to annual, we credit any remaining monthly days toward the annual price. Would you like me to calculate the exact cost for you?", sender: MessageSender.agent, offsetMinutes: 45 },
    ],
  },
  {
    subject: "How to set up automated reports",
    fromName: "Isabella White",
    fromEmail: "isabella.white@reportingnerd.com",
    status: TicketStatus.open,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(13),
    messages: [
      { body: "I want to receive weekly email reports summarizing our team's activity. I found the Reports section but couldn't figure out how to schedule automatic delivery. Can you guide me?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Supported browsers and minimum requirements",
    fromName: "Joshua Martinez",
    fromEmail: "joshua.martinez@itdept.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(50),
    messages: [
      { body: "Our IT department needs a list of supported browsers and minimum system requirements before we can approve deploying this to 500 users company-wide.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "We support Chrome 90+, Firefox 90+, Safari 14+, Edge 90+. Minimum requirements: 4GB RAM, stable internet connection. No software installation required — it's fully browser-based. Happy to provide official documentation for your IT team.", sender: MessageSender.agent, offsetMinutes: 90 },
    ],
  },
  {
    subject: "How to transfer account ownership",
    fromName: "Abigail Moore",
    fromEmail: "abigail.moore@teamchange.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(44),
    messages: [
      { body: "Our company founder is leaving and we need to transfer account ownership to our new CTO. How do we do this? We want to make sure the billing and admin access transfers correctly.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Abigail, go to Settings > Team > Manage Roles, select the new owner, and click 'Transfer Ownership'. You'll need to confirm via email. The current owner will be downgraded to Admin. Billing details transfer automatically.", sender: MessageSender.agent, offsetMinutes: 60 },
    ],
  },
  {
    subject: "Uptime SLA documentation needed",
    fromName: "Matthew Jackson",
    fromEmail: "matthew.jackson@enterprise.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(38),
    messages: [
      { body: "We need official SLA documentation showing your uptime guarantees for our vendor approval process. Can you provide this?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Matthew, our SLA guarantees 99.9% uptime on Business and Enterprise plans, with 99.5% on Pro. I've sent our full SLA documentation to your email. Please check your inbox (and spam folder).", sender: MessageSender.agent, offsetMinutes: 180 },
    ],
  },
  {
    subject: "Do you offer white-label solutions?",
    fromName: "Evelyn Anderson",
    fromEmail: "evelyn.anderson@agencyowner.com",
    status: TicketStatus.open,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(15),
    messages: [
      { body: "We're an agency that would like to resell your platform to our clients under our own brand. Do you offer white-label or partner programs?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Where to find our invoices",
    fromName: "Aiden Thomas",
    fromEmail: "aiden.thomas@accounting.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(28),
    messages: [
      { body: "Our accounting team needs all invoices from the past 12 months for our audit. Where can I download them? I only see the last 3 months in the billing section.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Aiden, go to Settings > Billing > Invoice History and use the date filter to show 'All Time'. You can download individual PDF invoices or use 'Export All' to get a ZIP file of all invoices.", sender: MessageSender.agent, offsetMinutes: 45 },
    ],
  },
  {
    subject: "Accessibility compliance — WCAG 2.1 support?",
    fromName: "Scarlett Robinson",
    fromEmail: "scarlett.r@accessibility.org",
    status: TicketStatus.open,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(16),
    messages: [
      { body: "We work with visually impaired users and need to know if your platform meets WCAG 2.1 AA compliance. Do you have an accessibility statement or VPAT?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Difference between admin and member roles",
    fromName: "Jacob Lee",
    fromEmail: "jacob.lee@newteam.co",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(20),
    messages: [
      { body: "Can you explain the difference between Admin and Member roles? I'm not sure which one to assign to my team leads vs regular employees.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Admins can manage billing, invite/remove users, edit workspace settings, and see all data. Members can only access and edit data within their assigned projects. Team leads typically get Admin; regular staff get Member.", sender: MessageSender.agent, offsetMinutes: 30 },
    ],
  },
  {
    subject: "Is there a desktop app available?",
    fromName: "Madison Harris",
    fromEmail: "madison.harris@poweruser.net",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(10),
    messages: [
      { body: "I spend all day in the tool and would love a desktop app for faster access and offline support. Is there a native desktop or Electron app available?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Madison, we don't have a native desktop app yet, but you can install the web app as a PWA on Mac, Windows, and Linux by clicking the install icon in your browser's address bar. It behaves like a native app.", sender: MessageSender.agent, offsetMinutes: 45 },
    ],
  },
  {
    subject: "How many API calls included in my plan?",
    fromName: "Sebastian Clark",
    fromEmail: "sebastian.clark@devtools.io",
    status: TicketStatus.open,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(17),
    messages: [
      { body: "I need to know the exact API call limits for the Pro plan. I'm building an integration and want to make sure we won't hit limits. What happens when we exceed them?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Can I use my own SMTP server for emails?",
    fromName: "Aria Lewis",
    fromEmail: "aria.lewis@emailcontrol.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(32),
    messages: [
      { body: "For compliance reasons, all outbound emails from our company must go through our own SMTP server. Can I configure the platform to use our SMTP instead of yours?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Aria, yes! Custom SMTP is available on Business and Enterprise plans. Go to Settings > Email > Custom SMTP and enter your server details. We support TLS/SSL and all major SMTP providers.", sender: MessageSender.agent, offsetMinutes: 60 },
    ],
  },
  {
    subject: "Training materials for new team members",
    fromName: "Elijah Walker",
    fromEmail: "elijah.walker@onboarding.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(26),
    messages: [
      { body: "We're onboarding 20 new employees next week and need training materials. Do you have videos, guides, or a help center we can share with them?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "We have a comprehensive help center at docs.helpdesk.io, video tutorials on our YouTube channel, and an onboarding guide at docs.helpdesk.io/getting-started. Would you like us to arrange a live onboarding session for your team?", sender: MessageSender.agent, offsetMinutes: 75 },
    ],
  },
  {
    subject: "Can we have multiple workspaces under one account?",
    fromName: "Penelope Hall",
    fromEmail: "penelope.hall@multibrand.com",
    status: TicketStatus.open,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(19),
    messages: [
      { body: "We operate three separate brands and need to keep their data isolated. Can we manage multiple workspaces from one login? Or do we need separate accounts for each brand?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },

  // More TECHNICAL QUESTIONS
  {
    subject: "Database backup restoration taking too long",
    fromName: "Carter Young",
    fromEmail: "carter.young@dbadmin.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(23),
    messages: [
      { body: "We initiated a data restore from a 2-week-old backup 6 hours ago and it's still showing 'In Progress'. No errors, no progress percentage. Is this normal for large datasets?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "IP whitelist not working for API access",
    fromName: "Layla King",
    fromEmail: "layla.king@security-team.com",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(40),
    messages: [
      { body: "We've added our office IP range (192.168.1.0/24) to the whitelist but are still getting 403 errors when hitting the API from those IPs. Our egress IP is confirmed within that range.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Layla, private IP ranges like 192.168.x.x are internal IPs that won't match your public egress IP. Please check your public IP at whatismyip.com and add that to the whitelist instead.", sender: MessageSender.agent, offsetMinutes: 45 },
    ],
  },
  {
    subject: "GraphQL subscription not receiving events",
    fromName: "Dylan Scott",
    fromEmail: "dylan.scott@graphqldev.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(25),
    messages: [
      { body: "Our GraphQL subscriptions connect successfully (no errors) but we never receive any events. REST webhooks work fine. We've verified the subscription query is correct per your docs.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Multi-region deployment — data residency question",
    fromName: "Natalie Green",
    fromEmail: "natalie.green@eucompany.eu",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(46),
    messages: [
      { body: "We're based in Germany and our data must stay within the EU per GDPR. Can you confirm where your servers are located? Can we ensure our data is only stored in EU data centers?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Natalie, we offer EU data residency on Business and Enterprise plans. Your data would be stored exclusively in our Frankfurt and Dublin data centers. I can send you our Data Processing Agreement and DPA addendum for GDPR compliance.", sender: MessageSender.agent, offsetMinutes: 120 },
    ],
  },
  {
    subject: "Audit log not showing all user actions",
    fromName: "Ryan Phillips",
    fromEmail: "ryan.phillips@compliance.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(27),
    messages: [
      { body: "The audit log is missing some user actions — specifically bulk delete operations and CSV imports. We need a complete audit trail for SOC 2 compliance. Are these events captured somewhere else?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "SDK throwing null pointer exception",
    fromName: "Samantha Evans",
    fromEmail: "samantha.e@devteam.uk",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(53),
    messages: [
      { body: "Your Node.js SDK v4.2.1 throws a null pointer exception when trying to paginate through an empty result set. `client.list({ limit: 10 })` works but when the response has 0 items, calling `.hasNextPage()` crashes the process.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Samantha, confirmed bug — null check was missing in the pagination iterator. Fixed in v4.2.2 released this morning. `npm install @helpdesk/sdk@4.2.2` will resolve it. Thank you for the detailed report!", sender: MessageSender.agent, offsetMinutes: 90 },
    ],
  },
  {
    subject: "2FA recovery codes not working",
    fromName: "Brandon Torres",
    fromEmail: "brandon.torres@lockedout.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(12),
    messages: [
      { body: "I lost my phone and tried using my recovery codes but they're being rejected. I copied them exactly as shown. I'm completely locked out of my account with important data inside.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Inconsistent timezone handling in reports",
    fromName: "Christine Nelson",
    fromEmail: "christine.nelson@global-team.com",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(60),
    messages: [
      { body: "Our team is spread across US, UK, and India. Reports seem to use different timezones inconsistently. Some data points show UTC, others show what looks like EST. Very confusing for team-wide analysis.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Christine, you can set a single account timezone in Settings > Preferences > Timezone. All reports will then use this timezone consistently. Existing reports will retroactively display in the new timezone on next refresh.", sender: MessageSender.agent, offsetMinutes: 75 },
    ],
  },
  {
    subject: "Payment gateway integration timeout errors",
    fromName: "Anthony Carter",
    fromEmail: "anthony.carter@ecommerce.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(29),
    messages: [
      { body: "Our Stripe integration is timing out intermittently during checkout. This happens roughly 1 in 20 transactions. The webhook confirms payment succeeded but our system shows an error. Customers are being double-charged in some cases.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },

  // More GENERAL QUESTIONS
  {
    subject: "Security certifications and compliance",
    fromName: "Monica Baker",
    fromEmail: "monica.baker@ciso-office.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(92),
    messages: [
      { body: "Before approving this vendor, our security team needs to know your compliance certifications. Do you have SOC 2 Type II, ISO 27001, or PCI DSS? Can you share audit reports?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Monica, we hold SOC 2 Type II and ISO 27001 certifications. PCI DSS SAQ-A is completed. I can share our most recent SOC 2 report under NDA and our ISO certificate is publicly available. Shall I send the NDA?", sender: MessageSender.agent, offsetMinutes: 180 },
    ],
  },
  {
    subject: "Migration help from competitor platform",
    fromName: "Gregory Murphy",
    fromEmail: "gregory.murphy@switching.com",
    status: TicketStatus.open,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(21),
    messages: [
      { body: "We're migrating from a competitor platform and have 5 years of historical data. Do you provide migration assistance? We have data in CSV format. About 500,000 records total.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Partnership and reseller inquiry",
    fromName: "Sandra Rogers",
    fromEmail: "sandra.rogers@partnerco.com",
    status: TicketStatus.open,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(31),
    messages: [
      { body: "We're interested in becoming an authorized reseller of your platform in Southeast Asia. Do you have a partner program? What are the requirements and commission structure?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Feature request: dark mode",
    fromName: "Keith Richardson",
    fromEmail: "keith.r@nightowl.dev",
    status: TicketStatus.closed,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(115),
    messages: [
      { body: "Love the product but please add dark mode! My eyes are hurting after long work sessions with the bright white interface. Many of my colleagues have requested this too.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Keith, great news — dark mode is actually on our Q2 roadmap! We'd love to add you to our beta list to try it when it's ready. Would you like to be notified?", sender: MessageSender.agent, offsetMinutes: 360 },
      { body: "Absolutely, please add me to the beta!", sender: MessageSender.customer, offsetMinutes: 400 },
    ],
  },
  {
    subject: "Custom branding on client-facing emails",
    fromName: "Teresa Cook",
    fromEmail: "teresa.cook@brandedco.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(36),
    messages: [
      { body: "We want our logo and brand colors on all outbound emails sent from the platform. Currently it shows your default branding. Is custom email branding available?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Teresa, custom email branding is available on Business and Enterprise plans. Go to Settings > Branding > Email Templates to upload your logo, set colors, and customize the footer. Would you like to upgrade?", sender: MessageSender.agent, offsetMinutes: 60 },
    ],
  },

  // More REFUND tickets
  {
    subject: "Billed for a plan I downgraded from",
    fromName: "Patrick Morris",
    fromEmail: "patrick.morris@downgraded.com",
    status: TicketStatus.open,
    category: TicketCategory.refund,
    createdAt: daysAgo(4),
    messages: [
      { body: "I downgraded from Business to Pro 2 weeks ago. My confirmation email says I'm on Pro, but I was just charged the Business price of $199 instead of $49. Please fix this and refund the difference.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Refund request — service outage during critical period",
    fromName: "Jessica Mitchell",
    fromEmail: "jessica.mitchell@criticaluser.com",
    status: TicketStatus.resolved,
    category: TicketCategory.refund,
    createdAt: daysAgo(66),
    messages: [
      { body: "Your platform was down for 6 hours on December 15th, which was our busiest sales day. We lost significant business. I'd like a credit or partial refund for the service disruption.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Jessica, I sincerely apologize for the December 15th outage. After reviewing the incident report, I've credited your account with 2 weeks of service ($50 equivalent) as compensation. This will appear on your next invoice.", sender: MessageSender.agent, offsetMinutes: 240 },
    ],
  },
  {
    subject: "Student discount refund — proof of enrollment",
    fromName: "Tyler Peterson",
    fromEmail: "tyler.peterson@university.edu",
    status: TicketStatus.resolved,
    category: TicketCategory.refund,
    createdAt: daysAgo(43),
    messages: [
      { body: "I signed up for the student discount but was charged full price. I've attached my student ID and enrollment letter. Can you apply the discount retroactively and refund the difference?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Tyler, I've verified your student status. I've applied the 50% student discount to your account and issued a refund of $24.99 for the difference on last month's charge.", sender: MessageSender.agent, offsetMinutes: 90 },
    ],
  },
  {
    subject: "Auto-renewal charged without reminder",
    fromName: "Nicole Ward",
    fromEmail: "nicole.ward@surprised.com",
    status: TicketStatus.open,
    category: TicketCategory.refund,
    createdAt: daysAgo(2),
    messages: [
      { body: "I was charged $299 for an annual renewal without any reminder email. I would have cancelled if I'd known it was renewing. Your terms say you send a 30-day notice but I received nothing. I want a full refund.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Promotional discount not applied at checkout",
    fromName: "Adam Edwards",
    fromEmail: "adam.edwards@couponuser.com",
    status: TicketStatus.resolved,
    category: TicketCategory.refund,
    createdAt: daysAgo(52),
    messages: [
      { body: "I had a promo code for 40% off (LAUNCH40) but it wasn't applied when I checked out. I was charged full price. Can you apply the discount and refund the difference?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Adam, I can see the promo code was entered but there was a system glitch preventing it from applying. I've manually applied the 40% discount and issued a refund of $31.96. Sorry for the hassle!", sender: MessageSender.agent, offsetMinutes: 30 },
    ],
  },

  // More TECHNICAL
  {
    subject: "Latency spikes affecting user experience",
    fromName: "Samantha Brooks",
    fromEmail: "samantha.brooks@performancewatcher.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(33),
    messages: [
      { body: "We're seeing periodic latency spikes where API responses go from ~200ms to 8-10 seconds. This happens 3-4 times per day for about 5 minutes each time. Other times performance is great.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "OpenID Connect configuration issues",
    fromName: "Nathan Simmons",
    fromEmail: "nathan.simmons@oidcdev.com",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(76),
    messages: [
      { body: "Configuring OpenID Connect with Azure AD B2C. Getting error 'Invalid redirect_uri' even though the URIs match exactly. I've triple checked the configuration on both sides.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Nathan, the issue is often a trailing slash mismatch — Azure AD B2C is strict about URI encoding. Make sure both URIs use the exact same scheme (https), no trailing slashes, and are URL-encoded identically. Can you share the specific URIs so I can compare?", sender: MessageSender.agent, offsetMinutes: 60 },
    ],
  },
  {
    subject: "Memory leak in embedded widget",
    fromName: "Danielle Foster",
    fromEmail: "danielle.foster@webdev.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(37),
    messages: [
      { body: "The embedded JavaScript widget is causing significant memory leak on pages that stay open for extended periods (like our customer support dashboard). Memory usage grows from 200MB to 2GB over 4 hours.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "CORS error on API requests from subdomain",
    fromName: "Kevin Murray",
    fromEmail: "kevin.murray@frontend.dev",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(83),
    messages: [
      { body: "Getting CORS errors when making API requests from app.mysite.com to your API. The error is 'Origin app.mysite.com not allowed'. I've added the domain in the allowed origins but still failing.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Kevin, the wildcard subdomain matching requires the format `https://*.mysite.com` — make sure you've added it with the asterisk. Also, changes to allowed origins can take up to 5 minutes to propagate. Try now and let us know.", sender: MessageSender.agent, offsetMinutes: 30 },
    ],
  },
  {
    subject: "Scheduled tasks not running on time",
    fromName: "Rachel James",
    fromEmail: "rachel.james@automation.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(41),
    messages: [
      { body: "I have scheduled tasks set to run daily at 9:00 AM UTC but they're running anywhere between 9:00 and 9:45 AM. For our business processes, timing needs to be within 1-2 minutes. Is precise scheduling available?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Webhooks being sent in wrong order",
    fromName: "Brian Cooper",
    fromEmail: "brian.cooper@eventdriven.io",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(57),
    messages: [
      { body: "Webhook events are arriving out of order. We see 'ticket.updated' before 'ticket.created' for the same ticket. This is causing issues with our event-driven architecture.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Brian, webhooks are delivered asynchronously and order is not guaranteed. We recommend using the event timestamp field to reorder events on your end, or use our polling API for order-sensitive workflows.", sender: MessageSender.agent, offsetMinutes: 90 },
    ],
  },

  // More GENERAL
  {
    subject: "Requesting a custom quote for 500+ users",
    fromName: "Joseph Bailey",
    fromEmail: "joseph.bailey@bigcompany.com",
    status: TicketStatus.open,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(34),
    messages: [
      { body: "We're looking at deploying your platform to approximately 600 users. The per-seat pricing on the website adds up quickly at that scale. Can we get a custom enterprise quote?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "How to set up custom roles and permissions",
    fromName: "Sarah Kelly",
    fromEmail: "sarah.kelly@rbac-team.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(47),
    messages: [
      { body: "We need fine-grained permission control. For example, some users should be able to view reports but not export data, and others should manage users but not access billing. How do we set this up?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Sarah, custom roles are available on Business and Enterprise plans. Go to Settings > Roles > Create Custom Role, then define permissions per module. You can then assign these custom roles to individual users.", sender: MessageSender.agent, offsetMinutes: 120 },
    ],
  },
  {
    subject: "How does data encryption work?",
    fromName: "Christopher Bell",
    fromEmail: "christopher.bell@securityminded.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(73),
    messages: [
      { body: "For security compliance purposes, I need to understand exactly how our data is encrypted. At rest? In transit? What cipher suites? Who holds the keys?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Christopher, all data is encrypted in transit (TLS 1.2+, AES-256) and at rest (AES-256-GCM). Encryption keys are managed by AWS KMS. We support customer-managed keys (CMEK) on Enterprise. Happy to share our full security whitepaper.", sender: MessageSender.agent, offsetMinutes: 90 },
    ],
  },
  {
    subject: "Can we get dedicated support hours?",
    fromName: "Jennifer Morgan",
    fromEmail: "jennifer.morgan@demanding.com",
    status: TicketStatus.open,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(38),
    messages: [
      { body: "Our business operates around the clock and we need guaranteed support response times. Is there an SLA for support response? Can we get a dedicated support engineer or account manager?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },

  // More REFUND
  {
    subject: "Team member charged individually — should be on our plan",
    fromName: "Andrew Diaz",
    fromEmail: "andrew.diaz@teamlead.com",
    status: TicketStatus.resolved,
    category: TicketCategory.refund,
    createdAt: daysAgo(84),
    messages: [
      { body: "One of our team members accidentally signed up for an individual account instead of joining our team workspace. They paid $49 for their own account. Can we merge accounts and refund them?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Andrew, I've merged the individual account into your team workspace and issued a full refund of $49 to the individual account's payment method. The merge preserves all their data.", sender: MessageSender.agent, offsetMinutes: 60 },
    ],
  },
  {
    subject: "Wrong currency charged — should be EUR not USD",
    fromName: "Anna Hoffmann",
    fromEmail: "anna.hoffmann@europe.de",
    status: TicketStatus.resolved,
    category: TicketCategory.refund,
    createdAt: daysAgo(71),
    messages: [
      { body: "I'm in Germany and selected EUR during signup, but I was charged in USD. The exchange rate difference is costing me extra in bank conversion fees. Can you set my account to EUR billing?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Anna, I've switched your billing currency to EUR and applied a credit to offset the currency conversion fee from last month's charge. Future invoices will be in EUR.", sender: MessageSender.agent, offsetMinutes: 75 },
    ],
  },

  // More TECHNICAL
  {
    subject: "Login redirect loop after password reset",
    fromName: "Peter Sullivan",
    fromEmail: "peter.sullivan@password.com",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(99),
    messages: [
      { body: "After resetting my password, clicking the reset link takes me through an infinite redirect loop. I've cleared all cookies and tried incognito mode — same issue. I can't log in at all.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Peter, this is a known issue with password reset links when the account has active SSO — the reset link tries to redirect to SSO which then redirects back. Please log in via your SSO provider instead, or contact your IT admin to disable SSO temporarily.", sender: MessageSender.agent, offsetMinutes: 120 },
    ],
  },
  {
    subject: "Notifications sent to wrong email address",
    fromName: "Lauren Price",
    fromEmail: "lauren.price@emailmix.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(43),
    messages: [
      { body: "All my notifications are going to my old email address (lauren@oldcompany.com) even though I updated my email to lauren.price@emailmix.com 3 weeks ago. The UI shows the correct email.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },

  // More GENERAL
  {
    subject: "Request for product roadmap",
    fromName: "Steven Gray",
    fromEmail: "steven.gray@poweruser.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(55),
    messages: [
      { body: "We're evaluating your platform for a long-term contract and need to understand your product direction. Is there a public roadmap? We want to make sure the features we need are planned.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Steven, our public roadmap is available at helpdesk.io/roadmap. For enterprise evaluations, we can also schedule a call with our product team to discuss upcoming features in more detail.", sender: MessageSender.agent, offsetMinutes: 90 },
    ],
  },
  {
    subject: "How to bulk delete records",
    fromName: "Karen Wood",
    fromEmail: "karen.wood@cleanup.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(64),
    messages: [
      { body: "I have thousands of old test records from our development phase that I need to clean up before going live. Is there a bulk delete option? Deleting one by one would take forever.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Karen, yes! Select multiple records using the checkboxes, then click 'Bulk Actions > Delete Selected'. You can also use our API endpoint DELETE /records/bulk with an array of IDs for programmatic bulk deletion.", sender: MessageSender.agent, offsetMinutes: 45 },
    ],
  },
  {
    subject: "Language and localization support",
    fromName: "Carlos Sanchez",
    fromEmail: "carlos.sanchez@multilang.mx",
    status: TicketStatus.open,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(49),
    messages: [
      { body: "Our team is based in Mexico and we need the platform interface in Spanish. Is there a Spanish language option? Also, does the platform handle Mexican peso (MXN) for billing?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Trial extension request",
    fromName: "Linda Hall",
    fromEmail: "linda.hall@moretimeplease.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(108),
    messages: [
      { body: "My 14-day trial is ending tomorrow and our decision maker was on vacation this week. Could we get a 1-week extension to complete our evaluation? We're very interested in purchasing.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Linda, absolutely! I've extended your trial by 7 days. Take your time with the evaluation and reach out if you have any questions.", sender: MessageSender.agent, offsetMinutes: 30 },
    ],
  },

  // Final tickets — mix of statuses and categories
  {
    subject: "Account locked after too many login attempts",
    fromName: "Raymond Long",
    fromEmail: "raymond.long@lockedout.com",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(116),
    messages: [
      { body: "My account got locked after entering my password incorrectly. I'm sure I know my password — how long does the lockout last and how do I unlock my account?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Raymond, account lockouts last 30 minutes and automatically unlock. If you're still locked out after 30 minutes, use the 'Forgot Password' link to reset. I've manually unlocked your account now.", sender: MessageSender.agent, offsetMinutes: 15 },
    ],
  },
  {
    subject: "Bulk email sending limits",
    fromName: "Dorothy Hughes",
    fromEmail: "dorothy.hughes@emailmarketer.com",
    status: TicketStatus.open,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(39),
    messages: [
      { body: "We plan to send monthly newsletters to 50,000 contacts through your platform. Is that within your sending limits? We're currently on the Pro plan.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Performance degradation after enabling audit logs",
    fromName: "Carl Foster",
    fromEmail: "carl.foster@sysadmin.com",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(91),
    messages: [
      { body: "Since enabling audit logs on all events, our dashboard performance has degraded significantly — everything is about 3x slower. Can we enable selective logging for only high-priority events?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Carl, yes — in Settings > Security > Audit Log, you can select which event categories to log. We recommend logging auth events, data exports, and admin actions, and skipping routine read operations. That should restore normal performance.", sender: MessageSender.agent, offsetMinutes: 60 },
    ],
  },
  {
    subject: "Can't change account email address",
    fromName: "Sandra Price",
    fromEmail: "sandra.price@newemail.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(44),
    messages: [
      { body: "I need to update my account email from my old employer's address to my personal email. The option to change email in settings is greyed out. My account is using Google SSO.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Refund for unused add-on features",
    fromName: "Eugene James",
    fromEmail: "eugene.james@wantrefund.com",
    status: TicketStatus.open,
    category: TicketCategory.refund,
    createdAt: daysAgo(18),
    messages: [
      { body: "I purchased the Advanced Analytics add-on 45 days ago for $99/month but realized it doesn't integrate with our existing BI tools as advertised. I'd like to cancel the add-on and get a prorated refund.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "CSV import failing with 'invalid format' error",
    fromName: "Virginia Cox",
    fromEmail: "virginia.cox@dataops.com",
    status: TicketStatus.resolved,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(102),
    messages: [
      { body: "Trying to import our customer list via CSV but keep getting 'invalid format'. I'm using the template downloaded from your site. The file has 2,000 rows and looks correct to me.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Virginia, the most common cause is the date format — our import expects MM/DD/YYYY but European Excel versions save as DD/MM/YYYY. Please check your 'created_date' column and reformat the dates. Let us know if that doesn't fix it.", sender: MessageSender.agent, offsetMinutes: 90 },
    ],
  },
  {
    subject: "Request for dedicated IP address",
    fromName: "Roger Ward",
    fromEmail: "roger.ward@ipwhitelist.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(56),
    messages: [
      { body: "Our firewall only allows outbound connections to specific IPs. We need to whitelist your platform but your IP ranges change. Can we get a dedicated static IP for our account?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "How to disable email notifications for specific events",
    fromName: "Alice Freeman",
    fromEmail: "alice.freeman@quietplease.com",
    status: TicketStatus.resolved,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(77),
    messages: [
      { body: "I'm getting too many email notifications. I want to keep alerts for critical events but turn off the daily digest emails and minor activity notifications. How do I customize this?", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Alice, go to Settings > Notifications > Email Preferences. You can toggle each notification type on/off individually. The 'Critical Alerts' category covers system-level events which I'd recommend keeping enabled.", sender: MessageSender.agent, offsetMinutes: 30 },
    ],
  },
  {
    subject: "Trouble adding credit card — validation errors",
    fromName: "Philip Stone",
    fromEmail: "philip.stone@billing.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(59),
    messages: [
      { body: "I'm trying to add my company credit card but keep getting validation errors even though the card is valid. I've tried 4 different cards including my personal card. All get declined with 'Card validation failed'.", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "How to integrate with Salesforce CRM",
    fromName: "Rachel Kim",
    fromEmail: "rachel.kim@salesforce-user.com",
    status: TicketStatus.open,
    category: TicketCategory.technical_questions,
    createdAt: daysAgo(62),
    messages: [
      { body: "We use Salesforce CRM and want to sync our customer tickets automatically. Is there a native Salesforce integration, or do we need to use the API/Zapier?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Refund for conference discount not applied",
    fromName: "Marcus Webb",
    fromEmail: "marcus.webb@conference.com",
    status: TicketStatus.resolved,
    category: TicketCategory.refund,
    createdAt: daysAgo(97),
    messages: [
      { body: "I signed up using the promo code from your SaaStr booth (SAAS2024) but was charged full price. The code was supposed to give 3 months free. Please apply the discount and refund two months.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Marcus, I've verified the SAAS2024 code and applied the 3-month free promotion to your account. Refund of $89.97 has been processed for the two months you've already paid.", sender: MessageSender.agent, offsetMinutes: 90 },
    ],
  },
  {
    subject: "How to set up Slack notifications for new tickets",
    fromName: "Frank Olsen",
    fromEmail: "frank.olsen@slackpower.com",
    status: TicketStatus.open,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(67),
    messages: [
      { body: "We want to get Slack notifications whenever a high-priority ticket is created. I found the Slack integration but can't figure out how to filter by priority. Can you walk me through it?", sender: MessageSender.customer, offsetMinutes: 0 },
    ],
  },
  {
    subject: "Account not activated after payment",
    fromName: "Diana Russo",
    fromEmail: "diana.russo@waitingforservice.it",
    status: TicketStatus.closed,
    category: TicketCategory.general_questions,
    createdAt: daysAgo(118),
    messages: [
      { body: "I completed payment 2 days ago but my account is still showing as 'pending activation'. I can't access any features. Payment was confirmed by my bank.", sender: MessageSender.customer, offsetMinutes: 0 },
      { body: "Hi Diana, I found the issue — there was a webhook failure between our payment processor and our provisioning system. I've manually activated your account. Everything should be accessible now.", sender: MessageSender.agent, offsetMinutes: 60 },
      { body: "It's working! Thank you for sorting that out quickly.", sender: MessageSender.customer, offsetMinutes: 75 },
    ],
  },
];

async function seedTickets() {
  console.log(`Seeding ${tickets.length} tickets...`);

  const agents = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  let created = 0;
  for (const t of tickets) {
    const assignedToId =
      agents.length > 0 && t.status !== TicketStatus.open
        ? agents[Math.floor(Math.random() * agents.length)].id
        : undefined;

    const ticket = await prisma.ticket.create({
      data: {
        subject: t.subject,
        fromEmail: t.fromEmail,
        fromName: t.fromName,
        status: t.status,
        category: t.category,
        assignedToId,
        createdAt: t.createdAt,
        updatedAt: t.createdAt,
      },
    });

    for (const m of t.messages) {
      const msgTime = new Date(t.createdAt.getTime() + m.offsetMinutes * 60_000);
      await prisma.message.create({
        data: {
          ticketId: ticket.id,
          body: m.body,
          sender: m.sender,
          authorId: m.sender === MessageSender.agent && agents.length > 0 ? agents[0].id : undefined,
          createdAt: msgTime,
        },
      });
    }

    created++;
  }

  console.log(`Done! Created ${created} tickets.`);
  await prisma.$disconnect();
}

seedTickets().catch((err) => {
  console.error(err);
  process.exit(1);
});

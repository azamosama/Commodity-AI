import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company, name, email, phone, locations, referrer, restaurant_type, notes } = body;

    // Create email content
    const subject = `New Signup: ${company}`;
    const emailBody = `New signup from Flavor Pulse website:

Company: ${company}
Contact Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Number of Locations: ${locations || 'Not provided'}
How they heard about us: ${referrer}
Restaurant Type: ${restaurant_type}
Additional Notes: ${notes || 'None'}

---
Sent from Flavor Pulse signup form`;

    // For now, we'll just log the email content
    // In a production environment, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    // - Resend
    console.log('=== NEW SIGNUP ===');
    console.log('To: info@flavorpulse.net');
    console.log(`Subject: ${subject}`);
    console.log('Body:');
    console.log(emailBody);
    console.log('==================');

    // TODO: Replace this with actual email sending logic
    // Example with a service like Resend:
    // await resend.emails.send({
    //   from: 'noreply@flavorpulse.net',
    //   to: 'info@flavorpulse.net',
    //   subject: subject,
    //   text: emailBody,
    // });

    return NextResponse.json({ success: true, message: 'Signup submitted successfully' });

  } catch (error) {
    console.error('Error processing signup:', error);
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    );
  }
}

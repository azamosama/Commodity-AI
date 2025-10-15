import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Log the email content for debugging
    console.log('=== NEW SIGNUP ===');
    console.log('To: info@flavorpulse.net');
    console.log(`Subject: ${subject}`);
    console.log('Body:');
    console.log(emailBody);
    console.log('==================');

    // Send email using Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'Flavor Pulse <noreply@flavorpulse.net>',
          to: ['info@flavorpulse.net'],
          subject: subject,
          text: emailBody,
          replyTo: email, // Allow replies to go directly to the customer
        });

        if (error) {
          console.error('Resend error:', error);
          // Still return success to user, but log the error
        } else {
          console.log('Email sent successfully:', data);
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Still return success to user, but log the error
      }
    } else {
      console.warn('RESEND_API_KEY not configured - email not sent');
    }

    return NextResponse.json({ success: true, message: 'Signup submitted successfully' });

  } catch (error) {
    console.error('Error processing signup:', error);
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    );
  }
}

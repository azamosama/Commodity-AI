import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

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
        const resend = new Resend(process.env.RESEND_API_KEY);
        console.log('Attempting to send email with Resend...');
        
        // Send to business email
        const { data, error } = await resend.emails.send({
          from: 'Flavor Pulse <onboarding@resend.dev>',
          to: ['info@flavorpulse.net'],
          subject: subject,
          text: emailBody,
          replyTo: email, // Allow replies to go directly to the customer
        });

        // Also send a copy to the user for testing
        const { data: userData, error: userError } = await resend.emails.send({
          from: 'Flavor Pulse <onboarding@resend.dev>',
          to: [email],
          subject: 'Thank you for signing up with Flavor Pulse!',
          text: `Hi ${name},

Thank you for your interest in Flavor Pulse! We've received your signup request and will be in touch shortly.

Here's a summary of your submission:
- Company: ${company}
- Contact: ${name}
- Email: ${email}
- Phone: ${phone || 'Not provided'}
- Locations: ${locations || 'Not provided'}
- Restaurant Type: ${restaurant_type}

We'll review your information and get back to you within 24 hours.

Best regards,
The Flavor Pulse Team

---
This email was sent to confirm your signup. If you didn't request this, please ignore this email.`,
        });

        if (error) {
          console.error('Resend error (business email):', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
        } else {
          console.log('Business email sent successfully:', data);
          console.log('Business email ID:', data?.id);
        }

        if (userError) {
          console.error('Resend error (user email):', userError);
          console.error('User error details:', JSON.stringify(userError, null, 2));
        } else {
          console.log('User email sent successfully:', userData);
          console.log('User email ID:', userData?.id);
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        console.error('Error stack:', emailError.stack);
        // Still return success to user, but log the error
      }
    } else {
      console.warn('RESEND_API_KEY not configured - email not sent');
      console.warn('Available env vars:', Object.keys(process.env).filter(key => key.includes('RESEND')));
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

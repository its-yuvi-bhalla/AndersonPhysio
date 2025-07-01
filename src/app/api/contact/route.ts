import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Initialize Supabase and Resend
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY!)

// Allowed frontend domains (add prod later)
const ALLOWED_ORIGINS = ['http://localhost:5173', 'https://www.andersonphysiotherapy.ca']

// Common CORS headers
const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin || '') ? origin! : '',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
})

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin')
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  })
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin')

  try {
    const body = await req.json()
    const { name, email, phone, message, preferredContact } = body

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: getCorsHeaders(origin),
      })
    }

    const { error: insertError } = await supabase.from('inquiries').insert([
      {
        name,
        email,
        phone: phone || null,
        message,
        preferred_contact: preferredContact || null,
      },
    ])

    if (insertError) {
      return new Response(JSON.stringify({ error: 'Database error', details: insertError.message }), {
        status: 500,
        headers: getCorsHeaders(origin),
      })
    }

    const { error: emailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: ['info@andersonphysiotherapy.ca'],
      subject: 'New Website Inquiry',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>New Inquiry Received</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Preferred Contact:</strong> ${preferredContact || 'N/A'}</p>
          <p><strong>Message:</strong><br/>${message}</p>
        </div>
      `,
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: getCorsHeaders(origin),
    })

  } catch (err) {
    console.error('[FATAL]', err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: getCorsHeaders(origin),
    })
  }
}

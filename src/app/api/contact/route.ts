import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: Request) {
  try {
    console.log('[INFO] Received POST request')

    const body = await req.json()
    console.log('[DEBUG] Parsed request body:', body)

    const { name, email, phone, message, preferredContact } = body

    if (!name || !email || !message) {
      console.warn('[WARN] Missing required fields:', { name, email, message })
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // Insert into Supabase
    const { error: insertError } = await supabase.from('inquiries').insert([
      {
        name,
        email,
        phone: phone || null,
        message,
        preferred_contact: preferredContact || null,
      }
    ])
    

    if (insertError) {
      console.error('[ERROR] Supabase insert error:', insertError)
      return new Response(JSON.stringify({ error: 'Database error', details: insertError.message }), { status: 500 })
    }

    console.log('[SUCCESS] Data inserted into Supabase')

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: ['yuvrajbhalla09@gmail.com'],
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

    if (emailError) {
      console.error('[ERROR] Resend email error:', emailError)
    } else {
      console.log('[SUCCESS] Email sent via Resend')
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (err) {
    console.error('[FATAL] Unhandled error:', err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
  }
}

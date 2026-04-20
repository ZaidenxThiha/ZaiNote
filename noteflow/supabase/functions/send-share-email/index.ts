import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { type, email, otp, note_id, recipient_id, permission } = body

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173'

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    let emailHtml = ''
    let subject = ''
    let toEmail = email

    if (type === 'otp') {
      subject = 'Your NoteFlow password reset code'
      emailHtml = `
        <h2>Password Reset</h2>
        <p>Your one-time code is:</p>
        <h1 style="letter-spacing: 8px; font-size: 36px;">${otp}</h1>
        <p>This code expires in 15 minutes.</p>
        <p>If you didn't request this, ignore this email.</p>
      `
    } else if (type === 'share') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      )
      const { data: recipient } = await supabase.from('profiles').select('email, display_name').eq('id', recipient_id).single()
      const { data: note } = await supabase.from('notes').select('title').eq('id', note_id).single()
      toEmail = recipient?.email
      subject = 'A note has been shared with you on NoteFlow'
      emailHtml = `
        <h2>Note shared with you</h2>
        <p>Hi ${recipient?.display_name},</p>
        <p>Someone shared a note "${note?.title || 'Untitled'}" with you with <strong>${permission}</strong> permission.</p>
        <a href="${APP_URL}/notes/${note_id}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;border-radius:8px;text-decoration:none;">View note</a>
      `
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'NoteFlow <noreply@noteflow.app>',
        to: [toEmail],
        subject,
        html: emailHtml,
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

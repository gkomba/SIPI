import { NextRequest, NextResponse } from 'next/server'
import { gerarEmailPoste } from './utils'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  const { data } = await req.json()

    const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD
    }
    });

    const to = process.env.RECIPIENT_EMAIL
    const subject = `Alerta de falha no(s) Poste(s) ${data.postes}`
    const html = gerarEmailPoste(data)

    try {
    await transporter.sendMail({
      from: `"SIPI - Sistema de Iluminação Pública Inteligente" <${process.env.SENDER_EMAIL}>`,
      to,
      subject,
      html
    });
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ ok: false, error: 'Failed to send email' }, { status: 500 })
  }
}

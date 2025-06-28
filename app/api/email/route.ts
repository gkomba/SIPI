import { NextRequest, NextResponse } from 'next/server'
import { gerarEmailPoste } from './utils'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  const { data } = await req.json()

    const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sistemadeiluminacaopublica@gmail.com',
        pass: 'igix egkj eoyj xnhd'
    }
    });

    const to = "kombagildo@gmail.com"
    const subject = `Alerta de falha no(s) Poste(s) ${data.postes}`
    const html = gerarEmailPoste(data)

    try {
    await transporter.sendMail({
      from: '"SIPI - Sistema de Iluminação Pública Inteligente" <sistemadeiluminacaopublica@gmail.com>',
      to,
      subject,
      html
    });
    return Response.json({ ok: true })
  } catch (error) {
    console.error('Error sending email:', error)
    return Response.json({ ok: false, error: 'Failed to send email' }, { status: 500 })
  }
}

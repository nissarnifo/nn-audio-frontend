interface OrderItem {
  productName: string
  variantLabel: string
  qty: number
  price: number
}

interface NotifyPayload {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  subtotal: number
  shipping: number
  total: number
  paymentMethod: string
  paymentStatus: string
  address: {
    name: string
    phone: string
    line1: string
    line2?: string | null
    city: string
    state: string
    pin: string
  }
  items: OrderItem[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export async function sendOrderNotification(payload: NotifyPayload) {
  await Promise.allSettled([sendEmail(payload), sendTelegram(payload)])
}

async function sendEmail(payload: NotifyPayload) {
  const { EMAIL_USER, EMAIL_PASS, EMAIL_FROM, EMAIL_HOST, EMAIL_PORT, EMAIL_TO } = process.env
  if (!EMAIL_USER || !EMAIL_PASS) return

  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.default.createTransport({
    host: EMAIL_HOST || 'smtp.gmail.com',
    port: Number(EMAIL_PORT) || 587,
    secure: false,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  })

  const itemRows = payload.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #1a3a55">${i.productName} (${i.variantLabel})</td>
         <td style="padding:6px 8px;border-bottom:1px solid #1a3a55;text-align:center">${i.qty}</td>
         <td style="padding:6px 8px;border-bottom:1px solid #1a3a55;text-align:right">${fmt(i.price)}</td>
         <td style="padding:6px 8px;border-bottom:1px solid #1a3a55;text-align:right">${fmt(i.price * i.qty)}</td></tr>`
    )
    .join('')

  const badge =
    payload.paymentStatus === 'PAID'
      ? `<span style="background:#00D4FF;color:#000;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold">PAID</span>`
      : `<span style="background:#FFB700;color:#000;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold">COD</span>`

  await transporter.sendMail({
    from: `"N & N Audio" <${EMAIL_FROM || EMAIL_USER}>`,
    to: EMAIL_TO || EMAIL_USER,
    subject: `New Order ${payload.orderNumber} — ${fmt(payload.total)}`,
    html: `
      <div style="font-family:monospace;background:#0A0E1A;color:#E8F4FD;padding:24px;max-width:600px;margin:auto">
        <h2 style="color:#00D4FF;margin-bottom:4px">New Order Received</h2>
        <p style="color:#4A7FA5;margin-top:0">${payload.orderNumber} &bull; ${badge}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#0D1B2A;color:#4A7FA5;font-size:11px;text-transform:uppercase">
            <th style="padding:6px 8px;text-align:left">Product</th>
            <th style="padding:6px 8px;text-align:center">Qty</th>
            <th style="padding:6px 8px;text-align:right">Price</th>
            <th style="padding:6px 8px;text-align:right">Total</th>
          </tr>
          ${itemRows}
        </table>
        <div style="text-align:right;color:#A8C8E0">
          <p>Subtotal: ${fmt(payload.subtotal)}</p>
          <p>Shipping: ${fmt(payload.shipping)}</p>
          <p style="color:#00D4FF;font-size:18px;font-weight:bold">Total: ${fmt(payload.total)}</p>
        </div>
        <hr style="border-color:#1a3a55;margin:16px 0"/>
        <p style="color:#4A7FA5;font-size:12px">
          <strong style="color:#E8F4FD">Customer:</strong> ${payload.customerName} &bull; ${payload.customerEmail} &bull; ${payload.customerPhone}<br/>
          <strong style="color:#E8F4FD">Ship to:</strong> ${payload.address.name}, ${payload.address.line1}${payload.address.line2 ? ', ' + payload.address.line2 : ''}, ${payload.address.city}, ${payload.address.state} - ${payload.address.pin}
        </p>
      </div>`,
  })
}

async function sendTelegram(payload: NotifyPayload) {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return

  const esc = (s: string) => s.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')
  const badge = payload.paymentStatus === 'PAID' ? '✅ PAID' : '💵 COD'

  const lines = [
    `🛒 *New Order: ${esc(payload.orderNumber)}* ${badge}`,
    `👤 ${esc(payload.customerName)} \\| ${esc(payload.customerEmail)}`,
    `📞 ${esc(payload.customerPhone)}`,
    ``,
    ...payload.items.map((i) => `• ${esc(i.productName)} \\(${esc(i.variantLabel)}\\) × ${i.qty} — ${esc(fmt(i.price * i.qty))}`),
    ``,
    `Subtotal: ${esc(fmt(payload.subtotal))}`,
    `Shipping: ${esc(fmt(payload.shipping))}`,
    `*Total: ${esc(fmt(payload.total))}*`,
    ``,
    `📦 ${esc(payload.address.line1)}, ${esc(payload.address.city)}, ${esc(payload.address.state)} ${esc(payload.address.pin)}`,
  ]

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: lines.join('\n'),
      parse_mode: 'MarkdownV2',
    }),
  })
}

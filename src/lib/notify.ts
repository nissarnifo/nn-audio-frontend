import nodemailer from 'nodemailer'

interface OrderNotifyPayload {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  total: number
  subtotal: number
  shipping: number
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
  items: Array<{
    productName: string
    variantLabel: string
    qty: number
    price: number
  }>
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

function buildEmailHtml(p: OrderNotifyPayload): string {
  const itemRows = p.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #333">${i.productName}</td>
        <td style="padding:8px;border-bottom:1px solid #333;color:#aaa">${i.variantLabel}</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:center">${i.qty}</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:right">${formatCurrency(i.price * i.qty)}</td>
      </tr>`
    )
    .join('')

  const addrLine = [p.address.line1, p.address.line2, p.address.city, p.address.state, p.address.pin]
    .filter(Boolean)
    .join(', ')

  const payBadge =
    p.paymentMethod === 'RAZORPAY'
      ? `<span style="background:#00D4FF;color:#000;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold">PAID (Razorpay)</span>`
      : `<span style="background:#f59e0b;color:#000;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold">COD</span>`

  return `
  <div style="font-family:sans-serif;background:#0a0a0a;color:#e0e0e0;max-width:600px;margin:auto;border-radius:8px;overflow:hidden">
    <div style="background:#111;padding:24px;border-bottom:2px solid #00D4FF">
      <h2 style="margin:0;color:#00D4FF">🛒 New Order Received!</h2>
      <p style="margin:4px 0 0;color:#888">N &amp; N Audio — Admin Notification</p>
    </div>
    <div style="padding:24px">
      <table style="width:100%;margin-bottom:20px">
        <tr>
          <td><strong>Order #</strong></td>
          <td style="color:#00D4FF;font-weight:bold">${p.orderNumber}</td>
        </tr>
        <tr>
          <td><strong>Payment</strong></td>
          <td>${payBadge}</td>
        </tr>
      </table>

      <h3 style="color:#00D4FF;border-bottom:1px solid #222;padding-bottom:8px">Customer</h3>
      <p style="margin:4px 0">👤 ${p.customerName}</p>
      <p style="margin:4px 0">📧 ${p.customerEmail}</p>
      <p style="margin:4px 0">📞 ${p.customerPhone || 'N/A'}</p>
      <p style="margin:4px 0">📍 ${addrLine}</p>

      <h3 style="color:#00D4FF;border-bottom:1px solid #222;padding-bottom:8px;margin-top:24px">Items</h3>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#1a1a1a">
            <th style="padding:8px;text-align:left">Product</th>
            <th style="padding:8px;text-align:left;color:#888">Variant</th>
            <th style="padding:8px;text-align:center">Qty</th>
            <th style="padding:8px;text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="margin-top:16px;text-align:right">
        <p style="margin:4px 0;color:#888">Subtotal: ${formatCurrency(p.subtotal)}</p>
        <p style="margin:4px 0;color:#888">Shipping: ${p.shipping === 0 ? 'Free' : formatCurrency(p.shipping)}</p>
        <p style="margin:8px 0;font-size:18px;font-weight:bold;color:#00D4FF">Total: ${formatCurrency(p.total)}</p>
      </div>
    </div>
    <div style="background:#111;padding:12px 24px;color:#555;font-size:12px">
      This is an automated notification from N &amp; N Audio.
    </div>
  </div>`
}

function buildTelegramText(p: OrderNotifyPayload): string {
  const itemLines = p.items
    .map((i) => `  • ${i.productName} (${i.variantLabel}) x${i.qty} — ₹${(i.price * i.qty).toLocaleString('en-IN')}`)
    .join('\n')

  const addrLine = [p.address.line1, p.address.line2, p.address.city, p.address.state, p.address.pin]
    .filter(Boolean)
    .join(', ')

  return `🛒 *New Order — N\\&N Audio*

📦 Order: \`${p.orderNumber}\`
💳 Payment: ${p.paymentMethod === 'RAZORPAY' ? 'PAID \\(Razorpay\\)' : 'Cash on Delivery'}

👤 *Customer*
Name: ${escTg(p.customerName)}
Email: ${escTg(p.customerEmail)}
Phone: ${p.customerPhone || 'N/A'}
Address: ${escTg(addrLine)}

🧾 *Items*
${itemLines}

💰 Subtotal: ₹${p.subtotal.toLocaleString('en-IN')}
🚚 Shipping: ${p.shipping === 0 ? 'Free' : '₹' + p.shipping.toLocaleString('en-IN')}
✅ *Total: ₹${p.total.toLocaleString('en-IN')}*`
}

function escTg(s: string): string {
  return s.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (c) => '\\' + c)
}

export async function sendOrderNotification(payload: OrderNotifyPayload) {
  const emailUser = process.env.EMAIL_USER
  const emailPass = process.env.EMAIL_PASS
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL
  const emailFrom = process.env.EMAIL_FROM || emailUser

  // ── Email ──────────────────────────────────────────────────────────────
  if (emailUser && emailPass && adminEmail) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: { user: emailUser, pass: emailPass },
      })
      await transporter.sendMail({
        from: `"N & N Audio" <${emailFrom}>`,
        to: adminEmail,
        subject: `🛒 New Order ${payload.orderNumber} — ₹${payload.total.toLocaleString('en-IN')}`,
        html: buildEmailHtml(payload),
      })
      console.log(`[notify] Admin email sent for order ${payload.orderNumber}`)
    } catch (err) {
      console.error('[notify] Admin email failed:', err)
    }
  }

  // ── Telegram ───────────────────────────────────────────────────────────
  const tgToken = process.env.TELEGRAM_BOT_TOKEN
  const tgChatId = process.env.TELEGRAM_CHAT_ID

  if (tgToken && tgChatId) {
    try {
      const text = buildTelegramText(payload)
      const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChatId, text, parse_mode: 'MarkdownV2' }),
      })
      if (!res.ok) {
        const body = await res.text()
        console.error('[notify] Telegram failed:', body)
      } else {
        console.log(`[notify] Telegram sent for order ${payload.orderNumber}`)
      }
    } catch (err) {
      console.error('[notify] Telegram error:', err)
    }
  }
}

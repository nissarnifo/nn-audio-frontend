import nodemailer from 'nodemailer'

// ─── Shared transport factory ─────────────────────────────────────────────────
function makeTransport() {
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASS
  if (!user || !pass) return null
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user, pass },
  })
}

function fromAddress() {
  return `"N & N Audio" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`
}

// ─── Shared email chrome ──────────────────────────────────────────────────────
function wrap(headerColor: string, headerHtml: string, bodyHtml: string) {
  return `
  <div style="font-family:sans-serif;background:#0a0e1a;color:#e0e6f0;max-width:600px;margin:auto;border-radius:8px;overflow:hidden;border:1px solid #1a2a3a">
    <div style="background:#0d1520;padding:20px 24px;border-bottom:2px solid ${headerColor}">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:22px;font-weight:900;color:${headerColor};letter-spacing:2px">N&N AUDIO</span>
      </div>
      <div style="margin-top:12px">${headerHtml}</div>
    </div>
    <div style="padding:24px">${bodyHtml}</div>
    <div style="background:#0d1520;padding:14px 24px;color:#4a6a8a;font-size:11px;border-top:1px solid #1a2a3a">
      N &amp; N Audio Systems · Precision Audio, Made in India<br>
      This is a transactional email — please do not reply.
    </div>
  </div>`
}

function fmtInr(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

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
      <h2 style="margin:0;color:#00D4FF">New Order Received!</h2>
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
      <p style="margin:4px 0">${p.customerName}</p>
      <p style="margin:4px 0">${p.customerEmail}</p>
      <p style="margin:4px 0">${p.customerPhone || 'N/A'}</p>
      <p style="margin:4px 0">${addrLine}</p>

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
    .map((i) => `  - ${i.productName} (${i.variantLabel}) x${i.qty} - Rs.${(i.price * i.qty).toLocaleString('en-IN')}`)
    .join('\n')

  const addrLine = [p.address.line1, p.address.line2, p.address.city, p.address.state, p.address.pin]
    .filter(Boolean)
    .join(', ')

  const payment = p.paymentMethod === 'RAZORPAY' ? 'PAID (Razorpay)' : 'Cash on Delivery'

  return `New Order - N&N Audio

Order: ${p.orderNumber}
Payment: ${payment}

Customer:
Name: ${p.customerName}
Email: ${p.customerEmail}
Phone: ${p.customerPhone || 'N/A'}
Address: ${addrLine}

Items:
${itemLines}

Subtotal: Rs.${p.subtotal.toLocaleString('en-IN')}
Shipping: ${p.shipping === 0 ? 'Free' : 'Rs.' + p.shipping.toLocaleString('en-IN')}
Total: Rs.${p.total.toLocaleString('en-IN')}`
}

export async function sendStockAlertEmail(payload: {
  toEmail: string
  productName: string
  variantLabel: string
  productSlug: string
  frontendUrl: string
}) {
  const emailUser = process.env.EMAIL_USER
  const emailPass = process.env.EMAIL_PASS
  const emailFrom = process.env.EMAIL_FROM || emailUser
  if (!emailUser || !emailPass) return

  const productUrl = `${payload.frontendUrl}/products/${payload.productSlug}`
  const html = `
  <div style="font-family:sans-serif;background:#0a0a0a;color:#e0e0e0;max-width:600px;margin:auto;border-radius:8px;overflow:hidden">
    <div style="background:#111;padding:24px;border-bottom:2px solid #00D4FF">
      <h2 style="margin:0;color:#00D4FF">Back in Stock!</h2>
      <p style="margin:4px 0 0;color:#888">N &amp; N Audio Systems</p>
    </div>
    <div style="padding:24px">
      <p>Great news! The item you were waiting for is now available:</p>
      <div style="background:#111;border:1px solid #00D4FF22;border-radius:6px;padding:16px;margin:16px 0">
        <p style="margin:0;font-size:16px;font-weight:bold;color:#E8F4FD">${payload.productName}</p>
        <p style="margin:4px 0 0;color:#4A7FA5;font-size:13px">${payload.variantLabel}</p>
      </div>
      <a href="${productUrl}"
        style="display:inline-block;background:#FFB700;color:#000;text-decoration:none;padding:12px 28px;border-radius:4px;font-weight:bold;font-size:14px;letter-spacing:1px">
        VIEW PRODUCT
      </a>
      <p style="margin-top:20px;font-size:12px;color:#555">
        Hurry - stock is limited! This alert was sent because you signed up at N &amp; N Audio Systems.
      </p>
    </div>
    <div style="background:#111;padding:12px 24px;color:#555;font-size:12px">
      N &amp; N Audio Systems - Precision Audio, Made in India
    </div>
  </div>`

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: { user: emailUser, pass: emailPass },
    })
    await transporter.sendMail({
      from: `"N & N Audio" <${emailFrom}>`,
      to: payload.toEmail,
      subject: `Back in Stock: ${payload.productName} (${payload.variantLabel})`,
      html,
    })
    console.log(`[notify] Stock alert sent to ${payload.toEmail} for ${payload.productName}`)
  } catch (err) {
    console.error('[notify] Stock alert email failed:', err)
  }
}

// ─── Customer: Order Confirmed ────────────────────────────────────────────────
export async function sendOrderConfirmationEmail(p: OrderNotifyPayload) {
  const transport = makeTransport()
  if (!transport) return

  const itemRows = p.items.map((i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #1a2a3a">${i.productName}<br><span style="color:#4a6a8a;font-size:12px">${i.variantLabel}</span></td>
      <td style="padding:8px 0;border-bottom:1px solid #1a2a3a;text-align:center;color:#8a9ab0">${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #1a2a3a;text-align:right;color:#FFB700">${fmtInr(i.price * i.qty)}</td>
    </tr>`).join('')

  const addrLine = [p.address.line1, p.address.line2, p.address.city, p.address.state, p.address.pin].filter(Boolean).join(', ')

  const body = `
    <p style="margin:0 0 16px;color:#8a9ab0;font-size:14px">Hi ${p.customerName},</p>
    <p style="margin:0 0 20px">Thank you for your order! We have received it and will begin processing soon.</p>

    <div style="background:#0d1520;border:1px solid #1a2a3a;border-radius:6px;padding:14px 16px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between">
        <span style="color:#4a6a8a;font-size:12px">ORDER NUMBER</span>
        <span style="color:#00D4FF;font-weight:bold">${p.orderNumber}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px">
        <span style="color:#4a6a8a;font-size:12px">PAYMENT</span>
        <span style="color:${p.paymentMethod === 'RAZORPAY' ? '#00FF88' : '#FFB700'}">${p.paymentMethod === 'RAZORPAY' ? 'PAID (Razorpay)' : 'Cash on Delivery'}</span>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead><tr style="color:#4a6a8a;font-size:11px;letter-spacing:1px">
        <th style="text-align:left;padding-bottom:6px">ITEM</th>
        <th style="text-align:center;padding-bottom:6px">QTY</th>
        <th style="text-align:right;padding-bottom:6px">AMOUNT</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="text-align:right;margin-bottom:20px">
      <p style="margin:4px 0;color:#4a6a8a;font-size:13px">Subtotal: ${fmtInr(p.subtotal)}</p>
      <p style="margin:4px 0;color:#4a6a8a;font-size:13px">Shipping: ${p.shipping === 0 ? 'FREE' : fmtInr(p.shipping)}</p>
      <p style="margin:8px 0;font-size:18px;font-weight:bold;color:#FFB700">Total: ${fmtInr(p.total)}</p>
    </div>

    <div style="background:#0d1520;border:1px solid #1a2a3a;border-radius:6px;padding:14px 16px;margin-bottom:20px">
      <p style="margin:0 0 4px;color:#4a6a8a;font-size:11px;letter-spacing:1px">DELIVERY ADDRESS</p>
      <p style="margin:0;font-size:13px">${p.address.name} - ${p.address.phone}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#8a9ab0">${addrLine}</p>
    </div>

    <p style="font-size:13px;color:#8a9ab0">You will receive another email when your order ships. For help, reply to this email.</p>`

  const html = wrap('#00D4FF', `<h2 style="margin:0;color:#E8F4FD;font-size:18px">Order Confirmed</h2>`, body)

  try {
    await transport.sendMail({
      from: fromAddress(),
      to: p.customerEmail,
      subject: `Order Confirmed - ${p.orderNumber}`,
      html,
    })
    console.log(`[mailer] Order confirmation sent to ${p.customerEmail}`)
  } catch (err) {
    console.error('[mailer] Order confirmation failed:', err)
  }
}

// ─── Customer: Order Status Update (SHIPPED / DELIVERED) ──────────────────────
export async function sendOrderStatusEmail(p: {
  customerName: string
  customerEmail: string
  orderNumber: string
  status: 'SHIPPED' | 'DELIVERED'
  total: number
}) {
  const transport = makeTransport()
  if (!transport) return

  const isShipped = p.status === 'SHIPPED'
  const color = isShipped ? '#00D4FF' : '#00FF88'
  const title = isShipped ? 'Your Order Has Shipped!' : 'Order Delivered!'
  const message = isShipped
    ? 'Great news - your order is on its way! You should receive it within 3-5 business days.'
    : 'Your order has been delivered. We hope you love your new gear! If you have any issues, please contact us within 30 days.'

  const body = `
    <p style="margin:0 0 16px;color:#8a9ab0;font-size:14px">Hi ${p.customerName},</p>
    <p style="margin:0 0 20px">${message}</p>
    <div style="background:#0d1520;border:1px solid #1a2a3a;border-radius:6px;padding:14px 16px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between">
        <span style="color:#4a6a8a;font-size:12px">ORDER NUMBER</span>
        <span style="color:#00D4FF;font-weight:bold">${p.orderNumber}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px">
        <span style="color:#4a6a8a;font-size:12px">STATUS</span>
        <span style="color:${color};font-weight:bold">${p.status}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px">
        <span style="color:#4a6a8a;font-size:12px">ORDER TOTAL</span>
        <span style="color:#FFB700;font-weight:bold">${fmtInr(p.total)}</span>
      </div>
    </div>
    ${!isShipped ? `<p style="font-size:13px;color:#8a9ab0">Enjoying your purchase? Leave a review on our website - it helps other customers and means a lot to us!</p>` : ''}
    <p style="font-size:13px;color:#8a9ab0">If you have any questions, just reply to this email.</p>`

  const html = wrap(color, `<h2 style="margin:0;color:#E8F4FD;font-size:18px">${title}</h2>`, body)

  try {
    await transport.sendMail({
      from: fromAddress(),
      to: p.customerEmail,
      subject: `${title} - ${p.orderNumber}`,
      html,
    })
    console.log(`[mailer] Order status (${p.status}) email sent to ${p.customerEmail}`)
  } catch (err) {
    console.error('[mailer] Order status email failed:', err)
  }
}

// ─── Customer: Return Status Update ──────────────────────────────────────────
export async function sendReturnStatusEmail(p: {
  customerName: string
  customerEmail: string
  orderNumber: string
  status: 'APPROVED' | 'REJECTED' | 'REFUNDED'
  adminNote?: string | null
}) {
  const transport = makeTransport()
  if (!transport) return

  const meta: Record<string, { color: string; title: string; message: string }> = {
    APPROVED: { color: '#00D4FF', title: 'Return Request Approved', message: 'Your return request has been approved. Please ship the item(s) back to us using the address we will provide via phone.' },
    REJECTED: { color: '#FF3366', title: 'Return Request Rejected', message: 'Unfortunately, your return request could not be approved at this time.' },
    REFUNDED: { color: '#00FF88', title: 'Refund Processed', message: 'Great news - your refund has been processed. It should reflect in your account within 5-7 business days.' },
  }

  const { color, title, message } = meta[p.status]

  const body = `
    <p style="margin:0 0 16px;color:#8a9ab0;font-size:14px">Hi ${p.customerName},</p>
    <p style="margin:0 0 20px">${message}</p>
    <div style="background:#0d1520;border:1px solid #1a2a3a;border-radius:6px;padding:14px 16px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between">
        <span style="color:#4a6a8a;font-size:12px">ORDER NUMBER</span>
        <span style="color:#00D4FF;font-weight:bold">${p.orderNumber}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px">
        <span style="color:#4a6a8a;font-size:12px">RETURN STATUS</span>
        <span style="color:${color};font-weight:bold">${p.status}</span>
      </div>
    </div>
    ${p.adminNote ? `<div style="background:#0d1520;border-left:3px solid ${color};padding:12px 16px;border-radius:0 6px 6px 0;margin-bottom:20px"><p style="margin:0 0 4px;color:#4a6a8a;font-size:11px">NOTE FROM SUPPORT</p><p style="margin:0;font-size:13px">${p.adminNote}</p></div>` : ''}
    <p style="font-size:13px;color:#8a9ab0">Questions? Reply to this email and our support team will get back to you.</p>`

  const html = wrap(color, `<h2 style="margin:0;color:#E8F4FD;font-size:18px">${title}</h2>`, body)

  try {
    await transport.sendMail({
      from: fromAddress(),
      to: p.customerEmail,
      subject: `${title} - ${p.orderNumber}`,
      html,
    })
    console.log(`[mailer] Return status (${p.status}) email sent to ${p.customerEmail}`)
  } catch (err) {
    console.error('[mailer] Return status email failed:', err)
  }
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
        subject: `New Order ${payload.orderNumber} - Rs.${payload.total.toLocaleString('en-IN')}`,
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
        body: JSON.stringify({ chat_id: tgChatId, text }),
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

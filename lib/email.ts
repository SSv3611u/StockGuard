import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail', // Standard for hackathons, you can use any SMTP provider
  auth: {
    user: process.env.SMTP_USER, // Your Gmail address (e.g., example@gmail.com)
    pass: process.env.SMTP_PASSWORD, // App Password, NOT standard password
  },
})

export async function sendEmailAlert(
  to: string,
  productName: string,
  expiryDate: string,
  quantity: number
) {
  const mailOptions = {
    from: '"StockGuard Alerts" <' + process.env.SMTP_USER + '>',
    to,
    subject: `🚨 StockGuard Expiry Alert: ${productName}`,
    text: `StockGuard Alert 🚨\n\nProduct: ${productName}\nQuantity: ${quantity}\nExpiry Date: ${new Date(expiryDate).toLocaleDateString()}\n\nThis item is entering the expiry risk zone (3 days or less). Please sell or remove it soon to avoid a complete loss.\n\nThanks,\nThe StockGuard System`,
  }

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('⚠️ SMTP_USER or SMTP_PASSWORD not configured. Skipping email send.')
      return
    }
    await transporter.sendMail(mailOptions)
    console.log(`Email alert sent to ${to} for ${productName}`)
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}

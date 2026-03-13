import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
const SMS_FROM = process.env.TWILIO_SMS_FROM || "";

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  let dest = to.trim();
  if (!dest.startsWith("whatsapp:")) {
    dest = `whatsapp:${dest}`;
  }
  
  // Ensure "from" also has prefix
  let from = WHATSAPP_FROM.trim();
  if (!from.startsWith("whatsapp:")) {
    from = `whatsapp:${from}`;
  }

  console.log(`Twilio: WhatsApp to ${dest} from ${from}`);
  
  await client.messages.create({
    from: from,
    to: dest,
    body: message,
  });
}

export async function sendSMS(to: string, message: string): Promise<void> {
  let phone = to.replace("whatsapp:", "").trim();
  if (!phone.startsWith("+")) phone = `+${phone}`;
  
  const from = SMS_FROM || WHATSAPP_FROM.replace("whatsapp:", "");
  
  console.log(`Twilio: SMS to ${phone} from ${from}`);
  
  await client.messages.create({
    from: from,
    to: phone,
    body: message,
  });
}

export async function sendAlert(to: string, message: string): Promise<void> {
    try {
        // Try WhatsApp first
        await sendWhatsApp(to, message);
        console.log("Twilio Success: WhatsApp delivered");
    } catch (err: any) {
        console.warn("WhatsApp failed, trying SMS...", err.message);
        try {
            await sendSMS(to, message);
            console.log("Twilio Success: SMS delivered");
        } catch (smsErr: any) {
            console.error("Twilio Critical Error: Both WhatsApp and SMS failed", smsErr.message);
            throw new Error(`Twilio Error: ${smsErr.message || "Unknown error"}`);
        }
    }
}

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

async function sendSmtpEmail(
  to: string[],
  subject: string,
  html: string,
  text?: string
): Promise<void> {
  const host = Deno.env.get("SMTP_HOST")!;
  const port = parseInt(Deno.env.get("SMTP_PORT") || "587");
  const username = Deno.env.get("SMTP_USERNAME")!;
  const password = Deno.env.get("SMTP_PASSWORD")!;
  const from = Deno.env.get("SMTP_FROM_EMAIL")!;

  // Connect to SMTP server
  let conn: Deno.Conn = await Deno.connect({ hostname: host, port });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function readResponse(): Promise<string> {
    const buffer = new Uint8Array(1024);
    const n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    return decoder.decode(buffer.subarray(0, n));
  }

  async function sendCommand(cmd: string): Promise<string> {
    await conn.write(encoder.encode(cmd + "\r\n"));
    return await readResponse();
  }

  // Read greeting
  await readResponse();

  // EHLO
  let response = await sendCommand(`EHLO ${host}`);
  
  // Check if STARTTLS is supported
  if (response.includes("STARTTLS")) {
    await sendCommand("STARTTLS");
    
    // Upgrade to TLS
    conn = await Deno.startTls(conn as Deno.TcpConn, { hostname: host });
    
    // Send EHLO again after TLS
    await sendCommand(`EHLO ${host}`);
  }

  // AUTH LOGIN
  await sendCommand("AUTH LOGIN");
  await sendCommand(btoa(username));
  response = await sendCommand(btoa(password));
  
  if (!response.startsWith("235")) {
    throw new Error("Authentication failed: " + response);
  }

  // MAIL FROM
  await sendCommand(`MAIL FROM:<${from}>`);

  // RCPT TO for each recipient
  for (const recipient of to) {
    await sendCommand(`RCPT TO:<${recipient}>`);
  }

  // DATA
  await sendCommand("DATA");

  // Build email content
  const boundary = `----=_Part_${Date.now()}`;
  const emailContent = [
    `From: ${from}`,
    `To: ${to.join(", ")}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    text || "",
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    html,
    ``,
    `--${boundary}--`,
    `.`
  ].join("\r\n");

  response = await sendCommand(emailContent);
  
  if (!response.startsWith("250")) {
    throw new Error("Failed to send email: " + response);
  }

  // QUIT
  await sendCommand("QUIT");
  conn.close();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text }: EmailRequest = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];
    
    await sendSmtpEmail(recipients, subject, html, text);

    console.log("Email sent successfully to:", recipients);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

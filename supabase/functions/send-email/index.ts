import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "nodemailer";

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

    const host = Deno.env.get("SMTP_HOST");
    const port = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const username = Deno.env.get("SMTP_USERNAME");
    const password = Deno.env.get("SMTP_PASSWORD");
    const from = Deno.env.get("SMTP_FROM_EMAIL");

    if (!host || !username || !password || !from) {
      return new Response(
        JSON.stringify({ error: "Missing SMTP configuration" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: username,
        pass: password,
      },
      // For port 587, enforce STARTTLS.
      requireTLS: port === 587,
      tls: {
        servername: host,
      },
    });

    const recipients = Array.isArray(to) ? to : [to];

    const info = await transporter.sendMail({
      from,
      to: recipients,
      subject,
      text: text || undefined,
      html,
    });

    console.log("Email sent successfully to:", recipients);
    console.log("messageId:", info?.messageId);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully", messageId: info?.messageId }),
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

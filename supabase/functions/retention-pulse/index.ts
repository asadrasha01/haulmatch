import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PulseRequest {
  driverId: string;
  driverName?: string;
  driverPhone?: string;
  carrierName?: string;
  daysCompleted?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as PulseRequest;
    const { driverId, driverName, driverPhone, carrierName, daysCompleted = 0 } = body;

    if (!driverId) {
      return new Response(
        JSON.stringify({ success: false, error: "driverId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const sentAt = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      last_sms_pulse_sent: sentAt,
      updated_at: sentAt,
    };

    if (daysCompleted >= 30) updatePayload.day_30_checked_in = true;
    if (daysCompleted >= 60) updatePayload.day_60_checked_in = true;
    if (daysCompleted >= 90) updatePayload.day_90_cleared = true;

    const { error: dbError } = await supabase
      .from("retention_milestones")
      .update(updatePayload)
      .eq("driver_id", driverId);

    if (dbError) {
      return new Response(
        JSON.stringify({ success: false, error: dbError.message, sentAt }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optional Twilio SMS dispatch when secrets are configured
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFrom = Deno.env.get("TWILIO_FROM_NUMBER");

    let deliveryMode: "twilio-live" | "edge-logged" = "edge-logged";
    const smsText = `HaulMatch 90-Day Check-In: Hi ${driverName || driverId}, how are your miles and equipment at ${carrierName || "your fleet"}? Reply 1 (Great), 2 (Issue with miles/pay), or 3 (Need call from recruiter).`;

    if (twilioSid && twilioToken && twilioFrom && driverPhone) {
      const form = new URLSearchParams({
        To: driverPhone,
        From: twilioFrom,
        Body: smsText,
      });

      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: form.toString(),
        }
      );

      if (twilioRes.ok) {
        deliveryMode = "twilio-live";
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        driverId,
        sentAt,
        deliveryMode,
        preview: smsText,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import twilio from "twilio";

export default publicProcedure
  .input(
    z.object({
      to: z.string(),
      message: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const twilioSid = process.env.TWILIO_SID;
      const twilioToken = process.env.TWILIO_TOKEN;
      const twilioMessagingSid = process.env.TWILIO_MESSAGING_SID;

      if (!twilioSid || !twilioToken || !twilioMessagingSid) {
        console.error("[send-sms] Missing Twilio environment variables");
        return {
          success: false,
          error: "Twilio credentials not configured",
        };
      }

      const client = twilio(twilioSid, twilioToken);

      const message = await client.messages.create({
        to: input.to,
        messagingServiceSid: twilioMessagingSid,
        body: input.message,
      });

      console.log(`[send-sms] SMS sent successfully. SID: ${message.sid}`);

      return {
        success: true,
        sid: message.sid,
      };
    } catch (error) {
      console.error("[send-sms] Error sending SMS:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  });

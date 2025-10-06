import { createTRPCRouter } from "@/backend/trpc/create-context";
import hiRoute from "@/backend/trpc/routes/example/hi/route";
import sendSmsRoute from "@/backend/trpc/routes/send-sms/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  sendSms: sendSmsRoute,
});

export type AppRouter = typeof appRouter;

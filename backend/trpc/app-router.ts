import { createTRPCRouter } from "@/backend/trpc/create-context";
import hiRoute from "@/backend/trpc/routes/example/hi/route";
import sendSmsRoute from "@/backend/trpc/routes/send-sms/route";
import getFuelPricesRoute from "@/backend/trpc/routes/fuel/get-prices/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  sendSms: sendSmsRoute,
  fuel: createTRPCRouter({
    getPrices: getFuelPricesRoute,
  }),
});

export type AppRouter = typeof appRouter;

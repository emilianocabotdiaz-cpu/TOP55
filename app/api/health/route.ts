import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    stripeSecret: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeMonthly: Boolean(process.env.STRIPE_PRICE_MONTHLY),
    stripeYearly: Boolean(process.env.STRIPE_PRICE_YEARLY),
    stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    openai: Boolean(process.env.OPENAI_API_KEY),
  });
}

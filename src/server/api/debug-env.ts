import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ? "✅ Loaded" : "❌ Missing",
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ? "✅ Loaded" : "❌ Missing",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "✅ Loaded" : "❌ Missing",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "✅ Loaded" : "❌ Missing",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ Loaded" : "❌ Missing",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "❌ Missing",
    NODE_ENV: process.env.NODE_ENV
  });
}
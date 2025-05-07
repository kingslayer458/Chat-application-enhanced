import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: {
      socketPort: process.env.SOCKET_PORT || "3000",
      nextPublicBaseUrl: process.env.NEXT_PUBLIC_BASE_URL || null,
    },
  })
}

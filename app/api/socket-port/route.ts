import { NextResponse } from "next/server"

export async function GET() {
  // Return a fixed port for the Socket.IO server
  return NextResponse.json({ port: "3001" })
}

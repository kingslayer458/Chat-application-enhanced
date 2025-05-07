import { NextResponse } from "next/server"
import type { User } from "@/lib/types"

// This would typically fetch from a database
// For now, we'll return a static list of users
export async function GET() {
  const users: User[] = [
    {
      username: "Alice",
      status: "online",
      room: "general",
    },
    {
      username: "Bob",
      status: "away",
      room: "general",
    },
    {
      username: "Charlie",
      status: "offline",
      room: "tech",
    },
  ]

  return NextResponse.json({ users })
}

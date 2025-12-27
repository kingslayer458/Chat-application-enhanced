import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// In-memory store for invites (would be a database in production)
const invites = new Map()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { roomId, username } = body

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    // Generate a unique invite ID
    const inviteId = uuidv4()

    // Store the invite data
    invites.set(inviteId, {
      roomId,
      inviter: username,
      createdAt: new Date().toISOString(),
    })

    // Generate the invite link
    // In production, use the configured base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === "production" ? "http://kingcloud.live:3000" : "http://localhost:3000")
    const inviteLink = `${baseUrl}/join/${inviteId}`

    return NextResponse.json({ inviteLink, inviteId })
  } catch (error) {
    console.error("Error generating invite:", error)
    return NextResponse.json({ error: "Failed to generate invite" }, { status: 500 })
  }
}

// Export the invites map so it can be accessed by the [inviteId] route
export { invites }

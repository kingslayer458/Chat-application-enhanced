import { NextResponse } from "next/server"
import { invites } from "../route"

export async function GET(request: Request, { params }: { params: { inviteId: string } }) {
  try {
    const inviteId = params.inviteId

    // Look up the invite in our in-memory store
    const invite = invites.get(inviteId)

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    // Get room details (in a real app, you would fetch this from a database)
    const roomDetails = {
      roomId: invite.roomId,
      roomName: getRoomName(invite.roomId),
      inviter: invite.inviter,
    }

    return NextResponse.json(roomDetails)
  } catch (error) {
    console.error("Error fetching invite:", error)
    return NextResponse.json({ error: "Failed to fetch invite" }, { status: 500 })
  }
}

// Helper function to get room name from ID
function getRoomName(roomId: string): string {
  const defaultRooms: Record<string, string> = {
    general: "General Chat",
    tech: "Tech Discussion",
    gossips: "Gossips",
    random: "Random",
    music: "Music",
    gaming: "Gaming",
    design: "Design",
    movies: "Movies",
    books: "Books",
  }

  return defaultRooms[roomId] || roomId
}

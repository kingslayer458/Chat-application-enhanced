import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import type { Message } from "@/lib/types"

// In-memory message store (would be a database in production)
const messages: Message[] = [
  {
    id: uuidv4(),
    content: "Welcome to the chat!",
    sender: "System",
    timestamp: new Date().toISOString(),
    reactions: [],
    room: "general",
    type: "text",
    readBy: [],
  },
]

export async function GET(request: Request) {
  // Get query parameters
  const { searchParams } = new URL(request.url)
  const room = searchParams.get("room")
  const limit = Number.parseInt(searchParams.get("limit") || "50", 10)

  // Filter messages by room if provided
  let filteredMessages = messages
  if (room) {
    filteredMessages = messages.filter((msg) => msg.room === room)
  }

  // Return the most recent messages first, limited by the limit parameter
  const sortedMessages = [...filteredMessages]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)

  return NextResponse.json({ messages: sortedMessages })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.content || !body.sender || !body.room) {
      return NextResponse.json({ error: "Missing required fields: content, sender, room" }, { status: 400 })
    }

    // Create new message
    const newMessage: Message = {
      id: uuidv4(),
      content: body.content,
      sender: body.sender,
      timestamp: new Date().toISOString(),
      reactions: [],
      room: body.room,
      type: body.type || "text",
      fileSize: body.fileSize,
      duration: body.duration,
      readBy: [{ username: body.sender, timestamp: new Date().toISOString() }],
    }

    // Add to messages array
    messages.push(newMessage)

    return NextResponse.json({ message: newMessage })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}

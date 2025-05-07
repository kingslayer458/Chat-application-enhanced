import { NextResponse } from "next/server"
import type { Room } from "@/lib/types"

export async function GET() {
  // This would typically fetch from a database
  // For now, we'll return additional custom rooms that don't duplicate the default ones
  const customRooms: Room[] = [
    {
      id: "design",
      name: "Design",
      description: "Discuss UI/UX and graphic design",
    },
    {
      id: "movies",
      name: "Movies",
      description: "Talk about your favorite films and TV shows",
    },
    {
      id: "books",
      name: "Books",
      description: "Share book recommendations and discussions",
    },
  ]

  return NextResponse.json({ rooms: customRooms })
}

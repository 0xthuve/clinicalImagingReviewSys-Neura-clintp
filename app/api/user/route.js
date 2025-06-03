import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";

export async function POST(req) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("BCAN");

    // Assuming your user document has a field 'role' with "consultant" or "radiologist"
    const user = await db.collection("user").findOne({ id: userId });

    if (!user) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    return NextResponse.json({ exists: true, role: user.category });
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

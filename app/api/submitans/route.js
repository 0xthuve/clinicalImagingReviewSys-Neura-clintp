// /app/api/submit-answer/route.js
import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";

export async function POST(req) {
  try {
    const { patientId, role, questions, reviewerId } = await req.json();

    if (!patientId || !role || !questions || !reviewerId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("BCAN");

    // Update patient's role section with new answers, reviewer details, and mark as answered
    const updateResult = await db.collection("patients").updateOne(
      { patientId },
      {
        $set: {
          [`${role}.questions`]: questions,
          [`${role}.answered`]: true,
          [`${role}.reviewerId`]: reviewerId,
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Answers submitted successfully" });
  } catch (error) {
    console.error("Submit Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

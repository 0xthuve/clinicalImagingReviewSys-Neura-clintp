import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";

export async function POST(req) {
  try {
    const { role } = await req.json();

    if (!role) {
      return NextResponse.json({ error: "Missing role" }, { status: 400 });
    }

    if (role !== "radiologist" && role !== "Consultant") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("BCAN");

    // Fetch all patient records projecting both role objects and _id
    const records = await db
      .collection("patients")
      .find(
        {},
        {
          projection: {
            patientId: 1,
            originalImage: 1,
            predictedImage: 1,
            radiologist: 1,
            Consultant: 1,
            _id: 1, // include _id field
          },
        }
      )
      .toArray();

    if (!records.length) {
      // No records found
      return NextResponse.json({ role, data: [] });
    }

    // Filter each record to include only the requested role object
    const filteredRecords = records.map((record) => {
      if (role === "radiologist") {
        const { Consultant, ...rest } = record;
        return rest;
      } else if (role === "Consultant") {
        const { radiologist, ...rest } = record;
        return rest;
      }
      return record;
    });

    return NextResponse.json({
      role,
      data: filteredRecords,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";

export async function POST(req) {
  try {
    const { role } = await req.json();

    if (!role) {
      return NextResponse.json({ error: "Missing role" }, { status: 400 });
    }

    if (role !== "Radiologist" && role !== "Consultant") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("BCAN");

    // Fetch all records with projection
    const records = await db
      .collection("patients")
      .find(
        {},
        {
          projection: {
            patientId: 1,
            originalImage: 1,
            predictedImage: 1,
            Radiologist: 1,
            Consultant: 1,
            _id: 1,
          },
        }
      )
      .toArray();

    // Filter records where the specified role has NOT answered
    const filteredRecords = records
      .filter((record) => record[role] && record[role].answered === false)
      .map((record) => {
        // Remove the other role's data
        const { Radiologist, Consultant, ...rest } = record;
        return {
          ...rest,
          [role]: record[role], // include only the selected role's data
        };
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

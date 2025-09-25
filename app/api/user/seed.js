import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";

// The expert users to seed
const expertUsers = [
  { id: "c001", name: "Dr. Anjali Kumaran", category: "Consultant" },
  { id: "c002", name: "Dr. Ramesh Perera", category: "Consultant" },
  { id: "r001", name: "Dr. Nilani Fernando", category: "Radiologist" },
  { id: "r002", name: "Dr. K. Tharshan", category: "Radiologist" },
  { id: "c003", name: "Dr. Malathi Sivarajah", category: "Consultant" },
  { id: "r003", name: "Dr. Mohamed Niyas", category: "Radiologist" },
  { id: "admin", name: "SenzuraAdmin", category: "Admin" },
];

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db("BCAN");
    const collection = db.collection("user");
    let inserted = 0;
    for (const user of expertUsers) {
      const exists = await collection.findOne({ id: user.id });
      if (!exists) {
        await collection.insertOne(user);
        inserted++;
      }
    }
    return NextResponse.json({ message: `Seeded ${inserted} new users.` });
  } catch (error) {
    console.error("Error seeding users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

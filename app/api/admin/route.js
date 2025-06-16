// /app/api/admin/route.js

import { NextResponse } from "next/server";
import clientPromise from "../../lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("BCAN");

    const patients = await db.collection("patients").find({}).toArray();

    return NextResponse.json({ patients });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

// Create a new patient
export async function POST(req) {
  try {
    const { patientId, originalImage, predictedImage } = await req.json();

    if (!patientId || !originalImage) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("BCAN");

    // Insert new patient with predefined structure
    await db.collection("patients").insertOne({
      patientId,
      originalImage,
      predictedImage: predictedImage || "",
      createdAt: new Date(),
      Consultant: {
        questions: {
          que1: { text: "Understandability", answer: false },
          que2: { text: "Clenical relevance", answer: false },
          que3: { text: "Truthfulness", answer: false },
          que4: { text: "Informative Plausibility", answer: false },
          que5: { text: "Computational Effeciency", answer: false },
        },
        answered: false,
      },
      Radiologist: {
        questions: {
          que1: { text: "Understandability", answer: false },
          que2: { text: "Clenical relevance", answer: false },
          que3: { text: "Truthfulness", answer: false },
          que4: { text: "Informative Plausibility", answer: false },
          que5: { text: "Computational Effeciency", answer: false },
        },
        answered: false,
      },
    });

    return NextResponse.json({ message: "Patient created successfully" });
  } catch (error) {
    console.error("Create Error.", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a patient
export async function PUT(req) {
  try {
    const {
      patientId,
      originalImage,
      predictedImage,
      ConsultantAnswered,
      RadiologistAnswered,
    } = await req.json();

    if (!patientId) {
      return NextResponse.json(
        { error: "PatientId is missing" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("BCAN");

    // Perform the update while retaining the questions
    const update = {
      $set: {
        originalImage,
        predictedImage,
        "Consultant.answered": ConsultantAnswered,
        "Radiologist.answered": RadiologistAnswered,
      },
    };

    const updateResult = await db
      .collection("patients")
      .updateOne({ patientId }, update);

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Patient updated successfully" });
  } catch (error) {
    console.error("Edit Error.", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a patient
export async function DELETE(req) {
  try {
    // Capture patientId from query parameters
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "PatientId is missing" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("BCAN");

    // Delete patient
    const deleteResult = await db
      .collection("patients")
      .deleteOne({ patientId });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Delete Error.", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

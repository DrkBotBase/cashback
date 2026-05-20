import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();
    // Find the admin user (assuming there's only one or we take the first one)
    const admin = await User.findOne({ role: "ADMIN" }).select("whatsapp name");

    if (!admin) {
      return NextResponse.json({ message: "Admin no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      whatsapp: admin.whatsapp,
      name: admin.name
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

export async function GET() {
  try {
    await dbConnect();
    let rewardPoints = await Settings.findOne({ key: "reward_points" });
    
    if (!rewardPoints) {
      // Default value if not set
      rewardPoints = await Settings.create({ key: "reward_points", value: 10 });
    }

    return NextResponse.json({ 
      value: rewardPoints.value,
      appUrl: process.env.NEXTAUTH_URL || ""
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { value } = await req.json();
    
    if (typeof value !== 'number' || value <= 0) {
      return NextResponse.json({ message: "Valor inválido" }, { status: 400 });
    }

    await dbConnect();
    const settings = await Settings.findOneAndUpdate(
      { key: "reward_points" },
      { value },
      { upsert: true, new: true }
    );

    return NextResponse.json({ value: settings.value });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

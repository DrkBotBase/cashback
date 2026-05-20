import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { increment } = await req.json();

    if (typeof increment !== "number") {
      return NextResponse.json({ message: "Incremento inválido" }, { status: 400 });
    }

    await dbConnect();

    // If decrementing, check if user has enough points
    if (increment < 0) {
      const currentUser = await User.findById(id);
      if (!currentUser || currentUser.points < Math.abs(increment)) {
        return NextResponse.json({ message: "Puntos insuficientes" }, { status: 400 });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $inc: { points: increment } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Puntos actualizados", 
      points: user.points 
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

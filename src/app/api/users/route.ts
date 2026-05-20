import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const whatsapp = searchParams.get("whatsapp");

    await dbConnect();

    if (!whatsapp) {
      // Return top clients and total count if no search term
      const totalClients = await User.countDocuments({ role: "CUSTOMER" });
      const topClients = await User.find({ role: "CUSTOMER" })
        .sort({ points: -1 })
        .limit(5);

      return NextResponse.json({
        totalClients,
        topClients
      });
    }

    // Exact search or partial search? The prompt said "la busqueda sea por el numero de telefono"
    // I'll do a partial search to make it easier to find.
    const users = await User.find({ 
      whatsapp: { $regex: whatsapp, $options: "i" },
      role: "CUSTOMER" 
    });

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

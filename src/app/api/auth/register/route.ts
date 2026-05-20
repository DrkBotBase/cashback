import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, whatsapp, password } = await req.json();

    if (!name || !whatsapp || !password) {
      return NextResponse.json({ message: "Todos los campos son obligatorios" }, { status: 400 });
    }

    await dbConnect();

    const userExists = await User.findOne({ whatsapp });

    if (userExists) {
      return NextResponse.json({ message: "Este número de WhatsApp ya está registrado" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      whatsapp,
      password: hashedPassword,
    });

    return NextResponse.json({ message: "Usuario registrado exitosamente" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

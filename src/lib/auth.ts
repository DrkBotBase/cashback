import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        whatsapp: { label: "WhatsApp", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.whatsapp || !credentials?.password) {
          throw new Error("Por favor ingrese WhatsApp y contraseña");
        }

        await dbConnect();
        const user = await User.findOne({ whatsapp: credentials.whatsapp }).select("+password");

        if (!user) {
          throw new Error("Usuario no encontrado");
        }

        const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordMatch) {
          throw new Error("Contraseña incorrecta");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          whatsapp: user.whatsapp,
          role: user.role,
          points: user.points,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.whatsapp = (user as any).whatsapp;
        token.points = (user as any).points;
      }
      
      // Update token if points are updated
      if (trigger === "update" && session?.points !== undefined) {
        token.points = session.points;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).whatsapp = token.whatsapp;
        (session.user as any).points = token.points;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

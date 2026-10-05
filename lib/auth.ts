import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { transferGuestData } from "./guest";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      // With the database strategy the session callback receives the DB user.
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    // When a visitor signs in, carry their village over to the account.
    async signIn({ user }) {
      try {
        const result = await transferGuestData(user.id);
        if (result.moved > 0) {
          console.log(
            `[village] moved ${result.moved} visitor thoughts to ${user.email}`
          );
        }
      } catch (error) {
        console.warn("[village] visitor transfer skipped:", error);
      }
    },
  },
};

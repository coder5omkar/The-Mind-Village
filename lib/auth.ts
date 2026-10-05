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
    // Record every sign-in, then carry a visitor's village to the account.
    async signIn({ user, account }) {
      try {
        await prisma.authEvent.create({
          data: {
            userId: user.id,
            event: "sign_in",
            provider: account?.provider ?? "google",
          },
        });
      } catch (error) {
        console.warn("[village] could not record sign-in:", error);
      }

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
    async signOut(message) {
      try {
        const payload = message as {
          session?: { userId?: string };
          token?: { sub?: string };
        };
        const userId = payload.session?.userId ?? payload.token?.sub;
        if (userId) {
          await prisma.authEvent.create({
            data: { userId, event: "sign_out" },
          });
        }
      } catch (error) {
        console.warn("[village] could not record sign-out:", error);
      }
    },
  },
};

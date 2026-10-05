import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-sign-in";
import { authOptions } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/app");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="game-panel-gold w-full max-w-md p-8 text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-black/40 bg-gradient-to-b from-[#243356] to-[#16203a] text-4xl shadow-chip">
          🏰
        </span>
        <h1 className="font-display text-2xl tracking-wide text-gold-300 [text-shadow:0_2px_0_rgba(0,0,0,0.5)]">
          SAVE YOUR VILLAGE
        </h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-400">
          Sign in so your thoughts, corrections and resident power are kept
          forever - on every device. Anything you built as a visitor moves with
          you.
        </p>
        <div className="mt-7">
          <GoogleSignInButton className="w-full" />
        </div>
        <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
        </div>
        <Link
          href="/app"
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          👋 Keep exploring as visitor
        </Link>
      </div>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mt-6"
        )}
      >
        Back to camp
      </Link>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { Landing } from "@/components/landing";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  return <Landing signedIn={Boolean(session?.user)} />;
}

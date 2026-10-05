import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { getGuestUser, getOrCreateGuestUser } from "./guest";

// A "viewer" is either a signed-in user or an anonymous visitor with a guest
// pass. All API routes and pages work with both.

export type Viewer = {
  id: string;
  name: string | null;
  image: string | null;
  email: string | null;
  isGuest: boolean;
};

function fromSession(user: {
  id: string;
  name?: string | null;
  image?: string | null;
  email?: string | null;
}): Viewer {
  return {
    id: user.id,
    name: user.name ?? null,
    image: user.image ?? null,
    email: user.email ?? null,
    isGuest: false,
  };
}

/** For API routes - creates the guest row if this is the visitor's first write. */
export async function requireViewer(): Promise<Viewer | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return fromSession(session.user);

  const guest = await getOrCreateGuestUser();
  if (!guest) return null;
  return {
    id: guest.id,
    name: guest.name,
    image: guest.image,
    email: null,
    isGuest: true,
  };
}

/** For server components - never writes to the database. */
export async function getViewer(): Promise<Viewer | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return fromSession(session.user);

  const guest = await getGuestUser();
  if (!guest) return null;
  return {
    id: guest.id,
    name: guest.name,
    image: guest.image,
    email: null,
    isGuest: true,
  };
}

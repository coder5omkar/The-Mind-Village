import { cookies } from "next/headers";
import { prisma } from "./prisma";

// Visitor ("guest pass") support. A guest is a real User row with a synthetic
// email, tied to the village_guest cookie set by middleware.

export const GUEST_COOKIE = "village_guest";

export function guestEmail(id: string) {
  return `guest-${id}@village.local`;
}

/** Read-only lookup - safe inside server components. */
export async function getGuestUser() {
  const id = cookies().get(GUEST_COOKIE)?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { email: guestEmail(id) } });
}

/** Creates the guest user row on first write. Safe inside API routes. */
export async function getOrCreateGuestUser() {
  const id = cookies().get(GUEST_COOKIE)?.value;
  if (!id) return null;
  return prisma.user.upsert({
    where: { email: guestEmail(id) },
    update: {},
    create: { email: guestEmail(id), name: "Village Visitor" },
  });
}

/**
 * Move everything a visitor built onto their freshly signed-in account, then
 * remove the guest row. Called from the NextAuth signIn event. The optional
 * email override exists so the transfer can be tested outside a request scope.
 */
export async function transferGuestData(
  targetUserId: string,
  guestEmailAddress?: string
) {
  let email = guestEmailAddress;
  if (!email) {
    const id = cookies().get(GUEST_COOKIE)?.value;
    if (!id) return { moved: 0 };
    email = guestEmail(id);
  }

  const guest = await prisma.user.findUnique({ where: { email } });
  if (!guest || guest.id === targetUserId) return { moved: 0 };

  const thoughts = await prisma.thought.updateMany({
    where: { userId: guest.id },
    data: { userId: targetUserId },
  });

  // Merge daily power (average where both sides already have a row).
  const [guestPower, targetPower] = await Promise.all([
    prisma.residentPower.findMany({ where: { userId: guest.id } }),
    prisma.residentPower.findMany({ where: { userId: targetUserId } }),
  ]);
  const keyOf = (row: { residentId: string; date: Date }) =>
    `${row.residentId}::${row.date.toISOString()}`;
  const targetByKey = new Map(targetPower.map((row) => [keyOf(row), row]));

  for (const row of guestPower) {
    const existing = targetByKey.get(keyOf(row));
    if (existing) {
      await prisma.residentPower.update({
        where: { id: existing.id },
        data: { power: (existing.power + row.power) / 2 },
      });
    } else {
      await prisma.residentPower.create({
        data: {
          userId: targetUserId,
          residentId: row.residentId,
          date: row.date,
          power: row.power,
        },
      });
    }
  }
  await prisma.residentPower.deleteMany({ where: { userId: guest.id } });

  await prisma.user.delete({ where: { id: guest.id } }).catch(() => {});

  return { moved: thoughts.count };
}

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

// A deliberately small public payload used by the wheel screen to pick up
// administrator edits without requiring visitors to refresh their browser.
export async function GET(_: Request, { params }: RouteProps) {
  const { id } = await params;
  const wheel = await db.wheel.findUnique({
    where: { id },
    select: {
      name: true,
      slices: true,
      customWinnerId: true,
      hideOnWin: true,
      backgroundImage: true,
      isDeleted: true,
      updatedAt: true,
    },
  });

  if (!wheel || wheel.isDeleted) return Response.json({ error: "Không tìm thấy vòng quay." }, { status: 404 });

  return Response.json({ ...wheel, updatedAt: wheel.updatedAt.toISOString() }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import { checkConnectAccountHealth } from "@/domain/shop";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const autoResync = searchParams.get("autoResync") === "true";

  try {
    const result = await checkConnectAccountHealth({ autoResync });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Health check failed";
    console.error("[admin/stripe/health-check] error:", error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

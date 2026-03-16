import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import { getDisputeEvidenceGuidance } from "@/domain/shop";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { disputeId } = await params;

  if (!disputeId) {
    return NextResponse.json(
      { error: "disputeId is required" },
      { status: 400 }
    );
  }

  const guidance = await getDisputeEvidenceGuidance(disputeId, session.user.id);

  if (!guidance) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  return NextResponse.json(guidance);
}

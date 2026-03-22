import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import {
  submitDisputeEvidence,
  DisputeEvidenceError,
  type DisputeEvidenceTextFields,
  type DisputeEvidenceFileField,
  type DisputeEvidenceFileFieldName,
} from "@/domain/shop/dispute-evidence";

export const runtime = "nodejs";

const TEXT_FIELD_NAMES: (keyof DisputeEvidenceTextFields)[] = [
  "uncategorized_text",
  "product_description",
  "customer_name",
  "customer_email_address",
  "shipping_tracking_number",
  "shipping_carrier",
];

const FILE_FIELD_NAMES: DisputeEvidenceFileFieldName[] = [
  "receipt",
  "shipping_documentation",
  "customer_communication",
  "uncategorized_file",
];

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf"];

function isAllowedMime(mime: string) {
  return ALLOWED_MIME_PREFIXES.some(
    (prefix) => mime === prefix || mime.startsWith(prefix)
  );
}

export async function POST(
  request: Request,
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  // Parse text fields
  const textFields: DisputeEvidenceTextFields = {};
  for (const name of TEXT_FIELD_NAMES) {
    const value = formData.get(name);
    if (typeof value === "string" && value.trim()) {
      textFields[name] = value.trim();
    }
  }

  // Parse file fields
  const files: DisputeEvidenceFileField[] = [];
  for (const name of FILE_FIELD_NAMES) {
    const value = formData.get(name);
    if (!(value instanceof File) || value.size === 0) continue;

    if (value.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File "${name}" exceeds 4MB limit` },
        { status: 400 }
      );
    }

    if (!isAllowedMime(value.type)) {
      return NextResponse.json(
        { error: `File "${name}" has unsupported type: ${value.type}` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await value.arrayBuffer());
    files.push({
      fieldName: name,
      buffer,
      filename: value.name,
      contentType: value.type,
    });
  }

  // Parse submit flag
  const submit = formData.get("submit") === "true";

  try {
    const result = await submitDisputeEvidence({
      externalDisputeId: disputeId,
      userId: session.user.id,
      textFields,
      files,
      submit,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof DisputeEvidenceError) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        FORBIDDEN: 403,
        INVALID_STATUS: 400,
        EXPIRED: 400,
      };
      return NextResponse.json(
        { error: error.message },
        { status: statusMap[error.code] || 500 }
      );
    }

    console.error("[dispute-evidence] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

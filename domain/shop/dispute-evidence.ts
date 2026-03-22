import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import {
  ORDER_DISPUTE_STATUS_NEEDS_RESPONSE,
  ORDER_DISPUTE_STATUS_WARNING_NEEDS_RESPONSE,
  serializeOrderDispute,
  type SerializedOrderDispute,
} from "./services";
import { handleStripeDisputeUpdated } from "./disputes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DisputeEvidenceTextFields {
  uncategorized_text?: string;
  product_description?: string;
  customer_name?: string;
  customer_email_address?: string;
  shipping_tracking_number?: string;
  shipping_carrier?: string;
}

export type DisputeEvidenceFileFieldName =
  | "receipt"
  | "shipping_documentation"
  | "customer_communication"
  | "uncategorized_file";

export interface DisputeEvidenceFileField {
  fieldName: DisputeEvidenceFileFieldName;
  buffer: Buffer;
  filename: string;
  contentType: string;
}

export interface SubmitDisputeEvidenceInput {
  externalDisputeId: string;
  userId: string;
  textFields: DisputeEvidenceTextFields;
  files: DisputeEvidenceFileField[];
  submit: boolean;
}

export interface SubmitDisputeEvidenceResult {
  dispute: SerializedOrderDispute;
  submitted: boolean;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export type DisputeEvidenceErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_STATUS"
  | "EXPIRED";

export class DisputeEvidenceError extends Error {
  constructor(
    public readonly code: DisputeEvidenceErrorCode,
    message: string
  ) {
    super(message);
    this.name = "DisputeEvidenceError";
  }
}

// ---------------------------------------------------------------------------
// Actionable status check
// ---------------------------------------------------------------------------

const ACTIONABLE_STATUSES: string[] = [
  ORDER_DISPUTE_STATUS_NEEDS_RESPONSE,
  ORDER_DISPUTE_STATUS_WARNING_NEEDS_RESPONSE,
];

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

export async function submitDisputeEvidence(
  input: SubmitDisputeEvidenceInput
): Promise<SubmitDisputeEvidenceResult> {
  const { externalDisputeId, userId, textFields, files, submit } = input;

  // 1. Lookup & ownership
  const dispute = await prisma.orderDispute.findUnique({
    where: { externalDisputeId },
    select: {
      id: true,
      userId: true,
      status: true,
      dueBy: true,
    },
  });

  if (!dispute) {
    throw new DisputeEvidenceError("NOT_FOUND", "Dispute not found");
  }

  if (dispute.userId !== userId) {
    throw new DisputeEvidenceError("FORBIDDEN", "Not your dispute");
  }

  // 2. Status check
  if (!ACTIONABLE_STATUSES.includes(dispute.status)) {
    throw new DisputeEvidenceError(
      "INVALID_STATUS",
      `Dispute status "${dispute.status}" does not accept evidence`
    );
  }

  // 3. Expiry check
  if (dispute.dueBy && dispute.dueBy < new Date()) {
    throw new DisputeEvidenceError(
      "EXPIRED",
      "Evidence submission deadline has passed"
    );
  }

  const stripe = getStripeClient();

  // 4. Upload files to Stripe
  const fileIds: Record<string, string> = {};

  for (const f of files) {
    const uploaded = await stripe.files.create({
      purpose: "dispute_evidence",
      file: {
        data: f.buffer,
        name: f.filename,
        type: f.contentType,
      },
    });
    fileIds[f.fieldName] = uploaded.id;
  }

  // 5. Build evidence object
  const evidence: Record<string, string> = {};

  for (const [key, value] of Object.entries(textFields)) {
    if (value?.trim()) {
      evidence[key] = value.trim();
    }
  }

  for (const [fieldName, fileId] of Object.entries(fileIds)) {
    evidence[fieldName] = fileId;
  }

  // 6. Submit to Stripe
  await stripe.disputes.update(externalDisputeId, {
    evidence: evidence as Record<string, string>,
    submit: submit || undefined,
  });

  // 7. Re-sync local DB from Stripe
  const updatedStripeDispute = await stripe.disputes.retrieve(
    externalDisputeId
  );
  await handleStripeDisputeUpdated(updatedStripeDispute);

  // 8. Read back local record and serialize
  const updatedLocal = await prisma.orderDispute.findUnique({
    where: { externalDisputeId },
  });

  if (!updatedLocal) {
    throw new DisputeEvidenceError(
      "NOT_FOUND",
      "Dispute not found after update"
    );
  }

  return {
    dispute: serializeOrderDispute(updatedLocal),
    submitted: submit,
  };
}

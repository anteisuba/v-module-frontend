export interface SlackWebhookMessageInput {
  webhookUrl: string;
  text: string;
}

export async function sendSlackWebhookMessage(
  input: SlackWebhookMessageInput
): Promise<void> {
  const response = await fetch(input.webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Slack webhook failed: ${response.status} ${response.statusText}${
        body ? ` - ${body}` : ""
      }`
    );
  }
}

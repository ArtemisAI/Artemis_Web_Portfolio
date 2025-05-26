import type { NextApiRequest, NextApiResponse } from 'next';

// This endpoint does not require JWT authentication as it's called by n8n.
// Security can be enhanced by using a secret token in the webhook URL
// that n8n sends and this handler verifies. For now, it's open.

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { flowId } = req.query; // Extracts the dynamic part of the URL

  try {
    console.log(`Received n8n callback for flowId: ${flowId}`);
    console.log('Request Body:', req.body); // Log the payload from n8n

    // Potential actions based on flowId or payload:
    // if (flowId === 'reminder_confirmation') {
    //   // e.g., update a task in Prisma, send a WebSocket message to the user
    //   const { userId, reminderText, confirmedTime } = req.body;
    //   console.log(`Reminder confirmed for user ${userId}: "${reminderText}" at ${confirmedTime}`);
    // } else if (flowId === 'some_other_flow') {
    //   // Handle other n8n workflows
    // }

    // Acknowledge receipt of the callback
    return res.status(200).json({ received: true, flowId: flowId, data: req.body });

  } catch (error: any) {
    console.error(`Error handling n8n callback for flowId ${flowId}:`, error);
    return res.status(500).json({ message: 'Internal Server Error', errorDetails: error.message });
  }
}

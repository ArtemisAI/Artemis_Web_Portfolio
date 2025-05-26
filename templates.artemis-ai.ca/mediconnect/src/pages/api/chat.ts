import type { NextApiResponse } from 'next';
import { verifyPatientToken, AuthenticatedPatientRequest } from '@/lib/verifyPatientToken';
import { handleMediConnectChatPrompt, McpMediConnectResponse } from '@/lib/mcpServiceMediConnect';

// import prisma from '@/lib/db'; // Not needed here as MCP service handles DB interaction

const handler = async (req: AuthenticatedPatientRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  // req.patient is guaranteed to be populated by verifyPatientToken middleware
  const patient = req.patient!; // Use non-null assertion if sure, or check again

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ message: 'Prompt is required and must be a non-empty string.' });
  }
  
  console.log(`Chat API: Received prompt from patientId: ${patient.patientId}`);

  try {
    // Call the MCP service for MediConnect
    const mcpResponse: McpMediConnectResponse = await handleMediConnectChatPrompt(prompt, patient);

    if (mcpResponse.error) {
      // If MCP service itself determined an error condition (e.g., service unavailable)
      // It's better to use a more specific status code if possible, e.g., 503 for service unavailable
      return res.status(503).json({ message: "Chat service error", errorDetails: mcpResponse.error });
    }

    // Call the MCP service for MediConnect
    const mcpResponse: McpMediConnectResponse = await handleMediConnectChatPrompt(prompt, patient);

    if (mcpResponse.error) {
      // If MCP service returns a specific error message (e.g., Ollama unavailable)
      return res.status(503).json({ message: "Chat service error", errorDetails: mcpResponse.error });
    }
    
    if (mcpResponse.stream) {
      // Handle streaming response for Ollama
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Useful for Nginx environments
      res.flushHeaders(); // Flush the headers to establish the connection

      try {
        for await (const chunk of mcpResponse.stream) {
          // Assuming chunk.response is the text part from ollama.generate
          // The exact structure of 'chunk' depends on the ollama library version.
          // Common structure is { response: "text chunk", done: false/true, ... }
          if (chunk && typeof chunk.response === 'string') {
            // SSE format: data: {json_string}\n\n
            res.write(`data: ${JSON.stringify({ content: chunk.response })}\n\n`);
          }
        }
      } catch (streamError: any) {
        console.error(`Chat API: Error streaming from Ollama for patient ${patient.patientId}:`, streamError);
        // Try to send an error message to the client if headers not already sent or connection is still open
        // This write might fail if the connection is already broken.
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: "Error during stream generation." })}\n\n`);
        }
      } finally {
        if (!res.writableEnded) {
          res.end(); // End the SSE stream
        }
      }
    } else if (mcpResponse.reply) {
      // Handle direct reply (e.g., from sales/tasks query from BizAssist, or FAQ/appointment from MediConnect)
      return res.status(200).json({ content: mcpResponse.reply });
    } else {
      // Should not happen if mcpResponse always has reply, stream, or error
      console.error(`Chat API: MCP response was empty or invalid for patient ${patient.patientId}:`, mcpResponse);
      return res.status(500).json({ message: 'Internal Server Error', errorDetails: 'Empty response from MCP.' });
    }
    
  } catch (error: any) {
    console.error(`Chat API error for patient ${patient.patientId}:`, error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Internal Server Error', errorDetails: error.message });
    } else if (!res.writableEnded) {
      // If headers are sent, try to send a final error event before closing
      res.write(`data: ${JSON.stringify({ error: "Internal Server Error", errorDetails: error.message })}\n\n`);
      res.end();
    }
    // If headers sent and stream ended, nothing more can be done.
  }
};

export default verifyPatientToken(handler);

import prisma from '@/lib/db'; 
import type { JwtPayload } from '@/lib/authMiddleware'; 
import { Ollama } from 'ollama'; 
import axios from 'axios'; // Import axios for HTTP requests

// Define a structure for the response from the MCP service
export interface McpResponse {
  reply?: string; 
  stream?: AsyncGenerator<any>; 
  chartData?: any; 
  error?: string; 
}

const ollama = new Ollama({ host: process.env.OLLAMA_URL || 'http://localhost:11434' }); 
const N8N_REMINDER_WEBHOOK_URL = process.env.N8N_REMINDER_WEBHOOK_URL;

// Basic date parsing - very simplistic. Consider a library for robust parsing.
// Example: "next Friday at 10am", "tomorrow 3pm", "2024-12-25 14:00"
// This regex tries to capture "<description>" on <date_and_time_string>
const REMINDER_REGEX_ON = /^\/remind\s+"([^"]+)"\s+on\s+(.+)$/i;
// Simpler: /remind "<description>" <date_and_time_string_without_on>
const REMINDER_REGEX_NO_ON = /^\/remind\s+"([^"]+)"\s+(.+)$/i;


export async function handleChatPrompt(
  prompt: string, 
  user: JwtPayload,
): Promise<McpResponse> {
  const { tenant_id, email, userId } = user; // Added userId for potential use

  // --- Intent: Reminder ---
  // Check for /remind command first as it's more specific
  if (prompt.toLowerCase().startsWith('/remind ')) {
    let reminderText: string | undefined;
    let dateTimeString: string | undefined;

    const matchOn = prompt.match(REMINDER_REGEX_ON);
    if (matchOn && matchOn.length === 3) {
      reminderText = matchOn[1];
      dateTimeString = matchOn[2];
    } else {
      const matchNoOn = prompt.match(REMINDER_REGEX_NO_ON);
      if (matchNoOn && matchNoOn.length === 3) {
        reminderText = matchNoOn[1];
        dateTimeString = matchNoOn[2];
      }
    }
    
    if (reminderText && dateTimeString) {
      if (!N8N_REMINDER_WEBHOOK_URL) {
        console.error('N8N_REMINDER_WEBHOOK_URL is not set in environment variables.');
        return { reply: "Sorry, the reminder service is not configured correctly." };
      }
      try {
        // For now, we send dateTimeString as is. n8n/Chrono-node would parse it.
        // A more robust solution would parse dateTimeString here to a Date object first.
        // Simplistic check: if dateTimeString can be converted to a Date object
        const parsedDate = new Date(dateTimeString); // Basic check
        if (isNaN(parsedDate.getTime())) {
            // This basic check might not catch all natural language dates.
            // A library like chrono-node would be better here.
            // For now, we'll be somewhat lenient and let n8n try to parse.
            console.warn(`MCP: Date string "${dateTimeString}" might not be easily parsable by new Date(). Forwarding to n8n.`);
        }

        const payload = {
          userId: userId, // Pass user ID for context in n8n
          tenantId: tenant_id,
          reminderText,
          dateTimeString, // Send the raw string for n8n to parse
          // reminderTimestamp: parsedDate.toISOString(), // If parsed locally
        };

        console.log('MCP: Sending reminder to n8n:', payload);
        const response = await axios.post(N8N_REMINDER_WEBHOOK_URL, payload, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.status >= 200 && response.status < 300) {
          // Assuming n8n returns details if successful, or just acknowledge
          const n8nReply = response.data?.message || `Reminder for "${reminderText}" is set for ${dateTimeString}.`;
          return { reply: n8nReply };
        } else {
          console.error('MCP: n8n reminder webhook failed with status:', response.status, response.data);
          return { reply: `Sorry, I couldn't set the reminder. The service responded with status ${response.status}.` };
        }
      } catch (error: any) {
        console.error('MCP: Error calling n8n reminder webhook:', error.message);
        if (axios.isAxiosError(error) && error.response) {
          console.error('MCP: n8n error response data:', error.response.data);
          return { reply: `Sorry, there was an issue with the reminder service: ${error.response.data?.message || error.message}` };
        }
        return { reply: "Sorry, I encountered an error while trying to set your reminder." };
      }
    } else {
      return { reply: "To set a reminder, please use the format: /remind \"<description>\" on <date/time string> (e.g., /remind \"Pay rent\" on next Friday at 10am)" };
    }
  }


  // --- Intent: Sales ---
  // (Keep existing sales intent logic here, ensuring it's after reminder intent)
  const lowerCasePrompt = prompt.toLowerCase(); // Already defined if reminder logic doesn't match
  if (lowerCasePrompt.includes('sales')) {
    try {
      const now = new Date();
      const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const salesData = await prisma.sale.aggregate({
        _sum: { amount: true },
        _count: { id: true }, // Count of sales transactions
        where: {
          tenantId: tenant_id,
          date: {
            gte: firstDayCurrentMonth,
            lte: lastDayCurrentMonth,
          },
        },
      });

      const totalSales = salesData._sum.amount || 0;
      const numTransactions = salesData._count.id || 0;

      if (numTransactions > 0) {
        return { 
          reply: `This month, your total sales are $${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from ${numTransactions} transactions.` 
        };
      } else {
        return { reply: "There are no sales recorded for the current month." };
      }
    } catch (error) {
      console.error("Error fetching sales data in MCP:", error);
      return { reply: "I encountered an error while trying to fetch your sales data." };
    }
  }

  // Tasks Intent
  if (lowerCasePrompt.includes('task') || lowerCasePrompt.includes('tasks')) {
    try {
      const pendingTasks = await prisma.task.findMany({
        where: {
          tenantId: tenant_id,
          completed: false,
        },
        orderBy: {
          dueAt: 'asc', // Get the soonest due task first
        },
        take: 5, // Limit to a few tasks to keep the response concise
      });

      if (pendingTasks.length > 0) {
        const taskSummary = pendingTasks.map(task => 
          `'${task.title}' due on ${new Date(task.dueAt).toLocaleDateString()}`
        ).join('; ');
        
        let reply = `You have ${pendingTasks.length} pending task(s). `;
        if (pendingTasks.length === 1) {
          reply += `It is: ${taskSummary}.`;
        } else if (pendingTasks.length <= 5) {
          reply += `The next few are: ${taskSummary}.`;
        } else {
           reply += `Here are the next 5: ${taskSummary}.`;
        }
        return { reply };
      } else {
        return { reply: "You have no pending tasks. Great job!" };
      }
    } catch (error) {
      console.error("Error fetching task data in MCP:", error);
      return { reply: "I encountered an error while trying to fetch your task data." };
    }
  }
  
  // Default response if no specific intent is matched - Delegate to Ollama LLM
  try {
    const systemMessage = "You are BizAssist, a helpful business assistant for a small business owner. " +
                          "Be concise and helpful. The user you are assisting is " + email + 
                          " from tenant ID " + tenant_id + ".";
    
    // TODO: Contextual Information (Stretch Goal)
    // let conversationHistory = "";
    // if (conversationId) {
    //   const messages = await prisma.message.findMany({
    //     where: { conversationId: conversationId, /* userId: user.userId (if needed) */ },
    //     orderBy: { createdAt: 'asc' },
    //     takeLast: 3, // Example: last 3 messages
    //   });
    //   conversationHistory = messages.map(msg => `${msg.role}: ${msg.content}`).join("\n") + "\n";
    // }
    // const fullPrompt = conversationHistory + `user: ${prompt}`;

    const fullPrompt = `${systemMessage}\n\nUser: ${prompt}\nAssistant:`;

    console.log(`MCP: Calling Ollama with model 'llama3' and prompt: "${fullPrompt.substring(0, 200)}..."`);

    const stream = await ollama.generate({
      model: "llama3", // As specified in README
      prompt: fullPrompt,
      stream: true,
    });

    return { stream }; // Return the stream directly

  } catch (error: any) {
    console.error("Error calling Ollama in MCP:", error);
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
        return { error: "The AI service (Ollama) is currently unavailable. Please try again later." };
    }
    return { error: "I encountered an error while trying to connect to the AI service." };
  }
}

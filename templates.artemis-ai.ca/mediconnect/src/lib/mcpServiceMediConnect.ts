import prisma from '@/lib/db'; 
import type { AuthenticatedPatientRequest } from '@/lib/verifyPatientToken'; 
import { Ollama } from 'ollama'; // Import Ollama client

interface PatientPayload {
  patientId: string;
  email: string;
}

export interface McpMediConnectResponse {
  reply?: string; // For direct, non-streamed replies
  stream?: AsyncGenerator<any>; // For streamed responses from Ollama
  chartData?: any; // Example from BizAssist, not directly applicable here yet
  error?: string; 
}

// Instantiate Ollama client using environment variable
const ollama = new Ollama({ host: process.env.OLLAMA_API_BASE_URL || 'http://localhost:11434' });

export async function handleMediConnectChatPrompt(
  prompt: string, 
  patient: PatientPayload 
): Promise<McpMediConnectResponse> {
  const { patientId, email } = patient;
  const lowerCasePrompt = prompt.toLowerCase();
  console.log(`MCP MediConnect: Processing prompt "${lowerCasePrompt}" for patientId ${patientId}`);

  // --- Intent: FAQ ---
  const faqKeywords = ["what is", "how to", "info on", "information about", "tell me about", "faq"];
  const isFaqQuery = faqKeywords.some(keyword => lowerCasePrompt.includes(keyword)) || lowerCasePrompt.endsWith("?");

  if (isFaqQuery) {
    try {
      // Attempt a broad search for keywords in the prompt within FAQ questions
      // This is a very basic search. More sophisticated search would use full-text search or embeddings.
      const searchTerms = lowerCasePrompt.split(" ").filter(term => term.length > 2 && !faqKeywords.some(fk => term.includes(fk))); // Basic term extraction
      
      let faqs = [];
      if (searchTerms.length > 0) {
        faqs = await prisma.fAQ.findMany({
          where: {
            OR: searchTerms.map(term => ({
              OR: [
                { question: { contains: term, mode: 'insensitive' } },
                { answer: { contains: term, mode: 'insensitive' } },
              ]
            })),
          },
          take: 3, // Limit results for brevity
        });
      } else { 
        // If only generic FAQ keywords, maybe list categories or top FAQs if available
        // For now, if no specific search terms, don't fetch all.
      }


      if (faqs.length > 0) {
        let reply = "Here's some information I found:\n";
        faqs.forEach(faq => {
          reply += `\nQ: ${faq.question}\nA: ${faq.answer}\n`;
        });
        return { reply: reply.trim() };
      } else if (isFaqQuery && !searchTerms.length) {
        // User asked a question but provided no specific terms beyond generic FAQ words
        return { reply: "What specific question do you have? I can try to answer from our FAQs." };
      }
      // If it looked like an FAQ but no specific terms matched, it will fall through to appointment/default.
      // Or, we can have a specific "no FAQ found" message here if they tried specific terms:
      // else if (isFaqQuery && searchTerms.length > 0) { 
      //    return { reply: "I couldn't find a specific FAQ for your query. Please try rephrasing or ask a different question."};
      // }
    } catch (error) {
      console.error(`MCP MediConnect: Error fetching FAQs for prompt "${prompt}":`, error);
      // Don't return error to user for FAQ, just fall through or give generic help for now
    }
  }

  // --- Intent: Check Next Appointment ---
  if (lowerCasePrompt.includes("my next appointment") || lowerCasePrompt.includes("do i have an appointment") || lowerCasePrompt.includes("my appointment")) {
    try {
      const nextAppointment = await prisma.appointment.findFirst({
        where: {
          patientId: patient.patientId,
          startsAt: {
            gte: new Date(), // Appointment is in the future
          },
        },
        orderBy: {
          startsAt: 'asc',
        },
      });

      if (nextAppointment) {
        return { 
          reply: `Your next appointment is on ${new Date(nextAppointment.startsAt).toLocaleDateString()} at ${new Date(nextAppointment.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} for "${nextAppointment.reason || 'a check-up'}". Status: ${nextAppointment.status}.`
        };
      } else {
        return { reply: "You have no upcoming appointments scheduled." };
      }
    } catch (error) {
      console.error(`MCP MediConnect: Error fetching next appointment for patient ${patient.patientId}:`, error);
      return { reply: "I encountered an error while trying to check your appointments." };
    }
  }

  // --- Intent: Doctor Availability (Simplified) ---
  if (lowerCasePrompt.includes("doctor available") || lowerCasePrompt.includes("availability on")) {
    // This is a simplified response. True availability checking is complex.
    try {
        // Optional: Check if there are any doctors at all
        const doctors = await prisma.staff.findMany({
            where: { role: 'doctor' }, // Assuming 'doctor' role exists
            take: 1 
        });

        if (doctors.length > 0) {
            return { reply: "We have doctors available. To book an appointment, please tell me your preferred date and time, or you can use our online booking system. You can also ask me to book an appointment for you by saying something like '/book appointment for next Tuesday at 3pm for a checkup'." };
        } else {
            return { reply: "It seems we currently don't have information on doctor availability. Please contact our clinic directly."};
        }
    } catch (error) {
        console.error(`MCP MediConnect: Error fetching doctor availability info:`, error);
        return { reply: "I encountered an error while trying to check doctor availability." };
    }
  }
  
  // Default response if no specific intent is matched - Delegate to Ollama LLM
  try {
    const systemPrompt = "You are a helpful AI assistant for MediConnect, designed to provide general health information and help with clinic-related queries. " +
                         "You are not a medical doctor and cannot provide medical diagnoses or treatment advice. Your responses are for informational purposes only. " +
                         "Always consult with a qualified healthcare professional for any medical concerns or before making any decisions related to your health. " +
                         "If asked about symptoms, you can provide general information but must strongly advise to consult a doctor for diagnosis.";

    // (Stretch Goal) Fetch conversation history - Basic Implementation
    let conversationHistory = "";
    try {
      const recentConversations = await prisma.conversation.findMany({
        where: { patientId: patientId },
        orderBy: { id: 'desc' }, // Assuming new conversations get new IDs; if using createdAt: { createdAt: 'desc' }
        take: 1, // Take the most recent conversation
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }, // Get messages in chronological order
            takeLast: 2, // Take last 2 messages (1 user, 1 assistant ideally)
          }
        }
      });

      if (recentConversations.length > 0 && recentConversations[0].messages.length > 0) {
        conversationHistory = recentConversations[0].messages
          .map(msg => `${msg.role === 'user' ? 'Previous User' : 'Previous Assistant'}: ${msg.content}`)
          .join("\n") + "\n";
        console.log(`MCP MediConnect: Fetched conversation history for patient ${patientId}: \n${conversationHistory}`);
      }
    } catch (historyError) {
      console.error(`MCP MediConnect: Error fetching conversation history for patient ${patientId}:`, historyError);
      // Proceed without history if it fails
    }
    
    const fullPrompt = `${conversationHistory}Current User: ${prompt}`;
    
    console.log(`MCP MediConnect: Calling Ollama with model 'llama2' for patient ${patientId}.`);
    // console.log(`MCP MediConnect: Full prompt (first 200 chars): "${fullPrompt.substring(0,200)}..."`); // For debugging

    const stream = await ollama.generate({
      model: "llama2", // Per problem description, "llama2" is a safe default.
                       // If a specific fine-tuned model is available, use that.
      prompt: fullPrompt,
      system: systemPrompt,
      stream: true,
    });

    return { stream }; // Return the stream directly

  } catch (error: any) {
    console.error(`MCP MediConnect: Error calling Ollama for patient ${patientId}:`, error);
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
        return { error: "The AI health assistant service is currently unavailable. Please try again later." };
    }
    if (error.message && error.message.includes("model 'llama2' not found")) {
        return { error: "The AI health assistant model 'llama2' is not available. Please contact support."};
    }
    return { error: "I encountered an error while trying to connect to the AI health assistant." };
  }
}

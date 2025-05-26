"use client"; // Required for client-side interactions

import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, User, Send } from 'lucide-react'; // Icons
import { cn } from '@/lib/utils';
// Assuming recharts is installed, import necessary components
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

type Message = { 
  id: string; 
  role: 'user' | 'assistant'; 
  content: string; 
  chartData?: {
    type: 'bar' | 'line'; // Define specific chart types you'll support
    data: any[];
    dataKey: string; // Key for the Y-axis data
    nameKey: string; // Key for the X-axis label
    // You can add more recharts-specific props here if needed, e.g., fill, stroke
  };
};

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null); 

  const scrollToBottom = () => {
    if (scrollAreaRef.current?.firstChild) {
      const viewport = scrollAreaRef.current.firstChild as HTMLDivElement;
      viewport.scrollTop = viewport.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageContent?: string) => {
    const currentInput = (messageContent || input).trim();
    if (!currentInput) return;

    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: currentInput };
    setMessages(prev => [...prev, userMessage]);
    
    if (!messageContent) { 
      setInput('');
    }
    setLoading(true);

    const assistantMessageId = `asst-${Date.now()}`;
    // Add a shell for the assistant's message
    setMessages(prev => [...prev, { 
      id: assistantMessageId, 
      role: 'assistant', 
      content: '', // Start with empty content
      chartData: undefined // Initialize chartData
    }]);

    // MOCKING CHART DATA FOR TESTING - REMOVE/ADAPT FOR PRODUCTION API
    if (userMessage.content.toLowerCase().includes("show sales chart")) {
      // Simulate API delay then provide mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      const mockChartData = {
        type: "bar" as const, // Ensure type is correctly inferred
        data: [
          { name: "Jan", sales: 1200 }, { name: "Feb", sales: 2100 },
          { name: "Mar", sales: 1600 }, { name: "Apr", sales: 2780 },
          { name: "May", sales: 1890 }, { name: "Jun", sales: 2390 },
        ],
        dataKey: "sales",
        nameKey: "name",
      };
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: "Here are the sales figures for the first half of the year:", chartData: mockChartData }
            : msg
        )
      );
      setLoading(false);
      return; // Exit early for mocked response
    }
    // END MOCKING CHART DATA

    // Actual API call and streaming logic (simplified for now)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }
      if (!res.body) {
        throw new Error('Response body is null');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let chartDataPayload: Message['chartData'] = undefined; // Correctly typed

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // This simplified logic assumes text chunks.
        // A real SSE implementation would parse event types and data fields.
        // If chart data is sent mid-stream in a specific JSON structure, that needs parsing here.
        accumulatedContent += chunk; 
        
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedContent, chartData: chartDataPayload } 
              : msg
          )
        );
      }
      // If chartDataPayload was identified during streaming (not implemented in this simplified loop)
      // it would already be set. If it comes as a final part, handle here.
    } catch (err: any) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: `Sorry, I encountered an error: ${err.message || 'Unknown error'}` }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };
  
  const presetQueries = [
    "Show weekly sales",
    "Any overdue tasks?",
    "Draft a marketing email for new product launch"
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-border flex flex-col h-[600px] md:h-[700px]">
      <CardHeader className="border-b">
        <CardTitle className="text-xl font-heading text-navy flex items-center">
          <Bot className="mr-2 h-6 w-6 text-orange" /> BizAssistant Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end space-x-2",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-orange text-white">
                      <Bot size={20} />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "p-3 rounded-lg max-w-[70%] shadow-sm",
                    msg.role === 'user'
                      ? 'bg-navy text-white rounded-br-none'
                      : 'bg-card border border-border rounded-bl-none text-foreground'
                  )}
                >
                  <p className="text-sm font-sans whitespace-pre-wrap">{msg.content}</p>
                  {msg.chartData && msg.chartData.type === 'bar' && (
                    <div className="mt-3 aspect-[16/9] max-w-full bg-background/50 p-2 rounded">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={msg.chartData.data} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                          <XAxis dataKey={msg.chartData.nameKey} stroke="hsl(var(--foreground))" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => typeof value === 'number' && value > 1000 ? `${value/1000}k` : value.toString()} />
                          <Tooltip
                            cursor={{fill: 'hsl(var(--accent))', fillOpacity: 0.1}}
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--popover))", 
                              borderColor: "hsl(var(--border))",
                              borderRadius: "var(--radius-sm)",
                              padding: "0.5rem",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
                            }}
                            labelStyle={{ color: "hsl(var(--popover-foreground))", fontSize: "12px", fontWeight: "bold", marginBottom: "0.25rem" }}
                            itemStyle={{ color: "hsl(var(--popover-foreground))", fontSize: "12px" }}
                          />
                          {/* <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}} /> */}
                          <Bar dataKey={msg.chartData.dataKey} fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name={msg.chartData.dataKey.charAt(0).toUpperCase() + msg.chartData.dataKey.slice(1)} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {/* Add other chart types (e.g., LineChart) here if needed */}
                </div>
                {msg.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User size={20} />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange"></div>
                <p className="ml-2 text-sm text-gray-500 font-sans">Assistant is typing...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <div className="w-full space-y-3">
          <div className="flex space-x-2">
            {presetQueries.map((query, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs font-sans"
                onClick={() => {
                  setInput(query); // Set input field
                  // Optionally send immediately: handleSend(query);
                }}
              >
                {query}
              </Button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault(); // Prevents newline in input
                  handleSend();
                }
              }}
              disabled={loading}
              placeholder="Ask BizAssistant..."
              className="flex-1 font-sans"
            />
            <Button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="bg-orange hover:bg-orange/90 text-white"
              aria-label="Send message"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
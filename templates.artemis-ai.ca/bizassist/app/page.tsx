"use client"; // Required for client-side hooks

// Developer Note:
// The real-time KPI updates on this page connect to a WebSocket server.
// This server needs to be run separately.
// From the `templates.artemis-ai.ca/bizassist` directory, run:
// `npm run start-ws` (or `node dist/websocketServer.js` if you've built it)
// The WebSocket server listens on port 3001 by default (see .env.example and websocketServer.ts).

import React, { useState, useEffect, useRef } from 'react'; 
import KpiCard from '@/components/cards/KpiCard';
import { DollarSign, ShoppingCart, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react'; // Added trend icons
import ChatWidget from '@/components/ChatWidget'; 
import { io, Socket } from 'socket.io-client';

// Define a type for individual KPI data
interface KpiValue {
  value: number;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  footer?: string;
}

// Define a type for the entire KPI dataset
interface KpiDataSet {
  totalRevenue: KpiValue;
  pendingOrders: KpiValue;
  openSupportTickets: KpiValue;
  completedTasks: KpiValue;
}

const initialKpiData: KpiDataSet = {
  totalRevenue: { value: 12345.67, trend: 'up', description: "+12.5% from last month", footer: "Updated 2 hours ago" },
  pendingOrders: { value: 42, trend: 'neutral', description: "5 are high priority", footer: "Real-time" },
  openSupportTickets: { value: 8, trend: 'down', description: "2 critical, 6 medium", footer: "Requires immediate attention" },
  completedTasks: { value: 127, trend: 'up', description: "This week", footer: "As of today" },
};

const WEBSOCKET_URL = 'ws://localhost:3001'; // Placeholder WebSocket server URL

export default function HomePage() {
  const [kpiData, setKpiData] = useState<KpiDataSet>(initialKpiData);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null); // Ref to hold the socket instance

  useEffect(() => {
    // Prevent duplicate connections if HMR or similar causes re-renders
    if (socketRef.current && socketRef.current.connected) {
      // console.log("WebSocket connection already established.");
      // return; 
      // For this subtask, we'll allow re-connection if not connected, but a more robust solution might manage this better.
    }
    
    const socketIoInstance: Socket = io(WEBSOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 10000, // 10 seconds
      // path: '/websocket', // Uncomment if your server uses a specific path like /websocket
    });
    socketRef.current = socketIoInstance;

    socketIoInstance.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socketIoInstance.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      // Attempt to reconnect explicitly if needed, or rely on socket.io's reconnectionAttempts
      // if (reason === 'io server disconnect') {
      //   socketIoInstance.connect();
      // }
    });

    socketIoInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    socketIoInstance.on('kpi_update', (update: Partial<KpiDataSet> | { kpi: keyof KpiDataSet; data: KpiValue }) => {
      console.log('Received KPI update from server:', update);
      setKpiData(prevData => {
        if ('kpi' in update && 'data' in update && update.kpi && typeof update.data === 'object') { // Single KPI update
          return { ...prevData, [update.kpi]: { ...prevData[update.kpi], ...update.data } };
        } else if (typeof update === 'object' && update !== null && !('kpi' in update)) { // Batch update for multiple KPIs
          // Ensure we merge deeply for each KPI in the batch
          let newKpiData = { ...prevData };
          for (const key in update) {
            if (Object.prototype.hasOwnProperty.call(update, key) && Object.prototype.hasOwnProperty.call(newKpiData, key)) {
              newKpiData[key as keyof KpiDataSet] = { 
                ...newKpiData[key as keyof KpiDataSet], 
                ...(update as Partial<KpiDataSet>)[key as keyof KpiDataSet] 
              };
            }
          }
          return newKpiData;
        }
        return prevData; // Return previous data if update format is not recognized
      });
    });

    // --- Test Simulation ---
    const simulationInterval = setInterval(() => {
      if (socketRef.current?.connected) { // Check actual socket connection for simulation
        const mockUpdateKey: keyof KpiDataSet = 'totalRevenue';
        // Important: Read current value from state inside setInterval to avoid stale closure
        setKpiData(currentKpiState => {
          const currentKpiValue = currentKpiState[mockUpdateKey];
          const newValue = currentKpiValue.value + Math.floor(Math.random() * 1000 - 450); // More balanced random
          const newTrend = Math.random() > 0.5 ? 'up' : 'down';
          
          const simulatedUpdateForServer = { // This is what server would send
            [mockUpdateKey]: {
                value: newValue,
                trend: newTrend,
                description: `Simulated at ${new Date().toLocaleTimeString()}`,
                // footer: currentKpiValue.footer // Keep original footer or update it too
            }
          };
          // To test the 'kpi_update' handler, emit to server or manually call handler logic
          // For direct client-side test of handler logic:
          console.log("Client-side SIMULATING server push with:", simulatedUpdateForServer);
          // socketRef.current?.emit('client_simulated_kpi_update', simulatedUpdateForServer); // If server echoes
          // OR manually trigger the update logic for testing purposes:
           if (socketRef.current?.listeners('kpi_update').length > 0) {
             // This simulates the server emitting the event.
             // The actual 'kpi_update' handler defined above will process this.
             // socketRef.current.emit('kpi_update', simulatedUpdateForServer); 
             // For pure client-side simulation without actual emit to a mock server:
             setKpiData(prevData => {
                let newKpiData = { ...prevData };
                for (const key in simulatedUpdateForServer) {
                  if (Object.prototype.hasOwnProperty.call(simulatedUpdateForServer, key) && Object.prototype.hasOwnProperty.call(newKpiData, key)) {
                    newKpiData[key as keyof KpiDataSet] = { 
                      ...newKpiData[key as keyof KpiDataSet], 
                      ...(simulatedUpdateForServer as Partial<KpiDataSet>)[key as keyof KpiDataSet] 
                    };
                  }
                }
                return newKpiData;
             });
           }
          return currentKpiState; // setKpiData was called, so return the current state for this updater
        });
      }
    }, 7000); // Simulate update every 7 seconds
    // --- End Test Simulation ---

    return () => {
      console.log('Cleaning up WebSocket connection.');
      clearInterval(simulationInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null; 
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500 ml-1" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500 ml-1" />;
    return <span className="h-4 w-4 ml-1"></span>; // Placeholder for neutral or no trend
  };

  return (
    <div className="space-y-8"> 
      <div> 
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-heading text-navy">Dashboard Overview</h1>
          <div className={`text-xs font-sans px-2 py-1 rounded-full flex items-center transition-colors duration-300 ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> 
          {/* KpiCard components will be updated to use kpiData state in a subsequent step */}
          <KpiCard 
            title="Total Revenue"
            value={`$${kpiData.totalRevenue.value.toLocaleString()}`} // Example of using initial state
            value={`$${kpiData.totalRevenue.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
            description={kpiData.totalRevenue.description}
            footerText={kpiData.totalRevenue.footer}
        />
        <KpiCard 
          title="Pending Orders"
            value={kpiData.pendingOrders.value.toString()}
          icon={ShoppingCart}
          description="5 are high priority"
          cardClassName="bg-orange/10 border-orange/50" 
        />
        <KpiCard 
          title="Open Support Tickets"
            value={kpiData.openSupportTickets.value.toString()}
          icon={AlertTriangle}
            description={kpiData.openSupportTickets.description}
            footerText={kpiData.openSupportTickets.footer}
        />
        <KpiCard 
          title="Completed Tasks"
            value={kpiData.completedTasks.value.toString()}
          icon={CheckCircle}
          description="This week"
        />
        {/* Add more KpiCard instances as needed */}
      </div>

      {/* You can add more sections to the dashboard below */}
      {/* 
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-2xl font-heading text-navy mb-4">Recent Activity</h2>
          <p className="font-sans text-gray-600">
            Placeholder for recent activity feed or other dashboard widgets...
          </p>
        </div> 
      */}

      {/* Chat Widget Section */}
      <div>
        {/* 
          Optionally, add a heading for the chat section if desired, e.g.:
          <h2 className="text-2xl font-heading text-navy mb-4">BizAssistant Chat</h2>
        */}
        <ChatWidget />
      </div>
    </div>
  )
}

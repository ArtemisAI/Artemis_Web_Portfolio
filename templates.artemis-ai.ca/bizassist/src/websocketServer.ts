import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

const WEBSOCKET_PORT = parseInt(process.env.WEBSOCKET_PORT || '3001', 10);

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for simplicity in dev. Restrict in production.
    methods: ["GET", "POST"]
  }
});

console.log(`WebSocket server starting on port ${WEBSOCKET_PORT}...`);

io.on('connection', (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Simulate sending KPI updates every 7-10 seconds
  const intervalId = setInterval(() => {
    const kpiUpdateData = {
      totalRevenue: { 
        value: Math.random() * 20000, 
        trend: Math.random() > 0.5 ? 'up' : 'down', 
        description: `Updated: ${new Date().toLocaleTimeString()}` 
      },
      pendingOrders: { 
        value: Math.floor(Math.random() * 50),
        trend: 'neutral',
        description: `${Math.floor(Math.random() * 10)} high priority`
      },
      openSupportTickets: {
        value: Math.floor(Math.random() * 20),
        trend: Math.random() > 0.7 ? 'up' : 'down',
        description: `${Math.floor(Math.random() * 5)} critical`
      },
      completedTasks: {
        value: Math.floor(Math.random() * 150),
        trend: 'up',
        description: "This week"
      }
    };
    
    console.log(`Sending kpi_update to ${socket.id}:`, JSON.stringify(kpiUpdateData).substring(0,100) + "...");
    socket.emit('kpi_update', kpiUpdateData);
  }, Math.random() * 3000 + 7000); // Random interval between 7 and 10 seconds

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    clearInterval(intervalId);
  });

  socket.on('error', (error) => {
    console.error(`Socket error for client ${socket.id}:`, error);
  });
});

httpServer.listen(WEBSOCKET_PORT, () => {
  console.log(`HTTP server wrapped by Socket.IO is listening on port ${WEBSOCKET_PORT}`);
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down WebSocket server...');
  io.close(() => {
    console.log('WebSocket server closed.');
    httpServer.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down WebSocket server...');
  io.close(() => {
    console.log('WebSocket server closed.');
    httpServer.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  });
});

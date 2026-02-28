import { WebSocketServer, WebSocket } from 'ws';
import { prisma } from '@clout/database';

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
}

export function setupWebSocket(wss: WebSocketServer) {
  // Heartbeat to keep connections alive
  const heartbeat = (ws: ExtendedWebSocket) => {
    ws.isAlive = true;
  };

  wss.on('connection', (ws: ExtendedWebSocket) => {
    ws.isAlive = true;

    ws.on('pong', () => heartbeat(ws));

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'auth':
            // Authenticate connection
            ws.userId = message.userId;
            ws.send(JSON.stringify({ type: 'auth', success: true }));
            break;

          case 'subscribe_bot_status':
            // Subscribe to bot status updates
            ws.send(JSON.stringify({
              type: 'bot_status',
              data: {
                online: true,
                uptime: Date.now(),
                guilds: 5,
                users: 1250,
                commands: 12,
                websocketPing: 45,
                memoryUsage: 128,
              },
            }));
            break;

          case 'get_stats':
            const stats = await getStats();
            ws.send(JSON.stringify({ type: 'stats', data: stats }));
            break;

          default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    // Send welcome message
    ws.send(JSON.stringify({ type: 'connected', message: 'Connected to Clout WebSocket' }));
  });

  // Ping clients every 30 seconds
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const extWs = ws as ExtendedWebSocket;
      if (!extWs.isAlive) {
        return extWs.terminate();
      }
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
}

async function getStats() {
  const [totalUsers, totalServers, totalTransactions] = await Promise.all([
    prisma.user.count(),
    prisma.server.count(),
    prisma.transaction.count(),
  ]);

  return {
    users: totalUsers,
    servers: totalServers,
    transactions: totalTransactions,
  };
}
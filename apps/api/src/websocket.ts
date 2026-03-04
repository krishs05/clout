import { WebSocketServer, WebSocket } from 'ws';
import { prisma } from '@clout/database';
import { botState } from './routes/bot';

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
}

let wssInstance: WebSocketServer | null = null;

export function setupWebSocket(wss: WebSocketServer) {
  wssInstance = wss;
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
              data: botState,
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

export function broadcastBotStatus(status: any) {
  if (!wssInstance) return;

  const message = JSON.stringify({
    type: 'bot_status',
    data: status,
  });

  wssInstance.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
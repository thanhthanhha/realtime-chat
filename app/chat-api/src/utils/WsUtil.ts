import WebSocket from 'ws';


// function flattenConnections(chatId: string): object {
//     const userConnections = activeConnections.get(chatId);
//     if (!userConnections) return {};
  
//     // Convert the Map to an object with connection status
//     const flattenedUsers = Array.from(userConnections.entries()).reduce((acc, [userId, ws]) => {
//       acc[userId] = {
//         connected: ws.readyState === WebSocket.OPEN,
//         readyState: ws.readyState // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED
//       };
//       return acc;
//     }, {} as Record<string, { connected: boolean, readyState: number }>);
  
//     return {
//       chatroom_id: chatId,
//       total_users: userConnections.size,
//       users: flattenedUsers
//     };
//   }
  
//   function formatWebSocketState(ws: WebSocket | undefined | null, userId: string): object {
//     if (!ws) {
//       return {
//         userId,
//         status: 'not_connected',
//         readyState: null
//       };
//     }
  
//     const readyStateMap = {
//       0: 'CONNECTING',
//       1: 'OPEN',
//       2: 'CLOSING',
//       3: 'CLOSED'
//     };
  
//     return {
//       userId,
//       status: ws.readyState === WebSocket.OPEN ? 'connected' : 'disconnected',
//       readyState: readyStateMap[ws.readyState],
//       bufferSize: ws.bufferedAmount,  // Amount of buffered data
//       protocol: ws.protocol,          // Protocol used by the connection
//     };
//   }
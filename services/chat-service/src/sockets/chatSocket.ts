import { Server, Socket } from 'socket.io';
import { ChatService } from '../services/chatService';
import { ConversationService } from '../services/conversationService';

// Store online users: Map<clerkUserId, Set<socketId>>
const onlineUsers = new Map<string, Set<string>>();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);
    
    let currentUserId: string | null = null;

    // User authentication - join personal room for DMs
    socket.on('user:online', (userId: string) => {
      currentUserId = userId;
      
      // Track user's socket connections
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId)!.add(socket.id);
      
      // Join personal room for receiving DMs
      socket.join(`user:${userId}`);
      console.log(`User ${userId} is online (socket: ${socket.id})`);
      
      // Broadcast online status to all users
      io.emit('user:status', { userId, online: true });
    });

    // Join project room (for project/channel messages)
    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`Socket ${socket.id} joined project:${projectId}`);
    });

    // Leave project room
    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      console.log(`Socket ${socket.id} left project:${projectId}`);
    });

    // Join conversation room (for DMs)
    socket.on('join:conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation:${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} left conversation:${conversationId}`);
    });

    // Join team room (for team chat)
    socket.on('join:team', (teamId: string) => {
      socket.join(`team:${teamId}`);
      console.log(`Socket ${socket.id} joined team:${teamId}`);
    });

    // Leave team room
    socket.on('leave:team', (teamId: string) => {
      socket.leave(`team:${teamId}`);
      console.log(`Socket ${socket.id} left team:${teamId}`);
    });

    // Send project message
    socket.on('message:send', async (data: {
      content: string;
      projectId: string;
      userId: string;
    }) => {
      try {
        const message = await ChatService.createMessage(
          data.content,
          data.projectId,
          data.userId
        );

        // Broadcast to all in the project room
        io.to(`project:${data.projectId}`).emit('message:new', message);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // DEPRECATED: Direct message sending via socket - use REST API instead
    // The REST API properly handles authentication via API Gateway and emits socket events
    // Keeping this commented out to avoid Clerk ID vs database ID mismatch errors
    /*
    socket.on('dm:send', async (data: {
      content: string;
      conversationId: string;
      senderId: string;
      receiverId: string;
    }) => {
      try {
        const message = await ConversationService.sendMessage(
          data.conversationId,
          data.senderId,
          data.content
        );

        // Send to both participants
        io.to(`conversation:${data.conversationId}`).emit('dm:new', message);
        
        // Also notify receiver's personal room (for notification badge)
        io.to(`user:${data.receiverId}`).emit('dm:notification', {
          conversationId: data.conversationId,
          senderId: data.senderId,
          preview: data.content.substring(0, 50),
        });
      } catch (error) {
        console.error('Error sending DM:', error);
        socket.emit('error', { message: 'Failed to send direct message' });
      }
    });
    */

    // Mark messages as read
    socket.on('dm:read', async (data: {
      conversationId: string;
      userId: string;
    }) => {
      try {
        await ConversationService.markAsRead(data.conversationId, data.userId);
        
        // Notify the sender that messages were read
        io.to(`conversation:${data.conversationId}`).emit('dm:read', {
          conversationId: data.conversationId,
          readBy: data.userId,
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Typing indicators for projects
    socket.on('typing:start', (data: { projectId: string; userId: string }) => {
      socket.to(`project:${data.projectId}`).emit('typing:user', {
        userId: data.userId,
        isTyping: true,
      });
    });

    socket.on('typing:stop', (data: { projectId: string; userId: string }) => {
      socket.to(`project:${data.projectId}`).emit('typing:user', {
        userId: data.userId,
        isTyping: false,
      });
    });

    // Typing indicators for DMs
    socket.on('dm:typing:start', (data: { conversationId: string; userId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('dm:typing', {
        userId: data.userId,
        isTyping: true,
      });
    });

    socket.on('dm:typing:stop', (data: { conversationId: string; userId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('dm:typing', {
        userId: data.userId,
        isTyping: false,
      });
    });

    // Get online status of users
    socket.on('users:online:check', (userIds: string[]) => {
      const statuses = userIds.map(id => ({
        userId: id,
        online: onlineUsers.has(id) && onlineUsers.get(id)!.size > 0,
      }));
      socket.emit('users:online:status', statuses);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      // Remove socket from online users
      if (currentUserId) {
        const userSockets = onlineUsers.get(currentUserId);
        if (userSockets) {
          userSockets.delete(socket.id);
          
          // If no more sockets, user is offline
          if (userSockets.size === 0) {
            onlineUsers.delete(currentUserId);
            io.emit('user:status', { userId: currentUserId, online: false });
          }
        }
      }
    });
  });
}

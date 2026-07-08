const { Server } = require("socket.io");
const Document = require("../models/document.model");
const { verifyAccessToken } = require("../utils/jwt");
const { canWrite } = require("../constants/roles");
const syncService = require("../services/sync.service");
const dashboardService = require("../services/dashboard.service");

// const initSocket = (httpServer, corsOrigin) => {
//   const io = new Server(httpServer, {
//     cors: {
//       origin: corsOrigin,
//       credentials: true,
//     },
//   });

  const initSocket = (httpServer, allowedOrigins) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  /*
   * Authentication
   */
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyAccessToken(token);

      socket.userId = decoded.userId;

      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket Connected:", socket.id);

    // Personal room for dashboard updates
    socket.join(`user:${socket.userId}`);

    /*
     * Join document
     */
    socket.on("join-document", async ({ documentId }) => {
      try {
        const document = await Document.findById(documentId);

        if (!document) {
          socket.emit("error", {
            message: "Document not found",
          });
          return;
        }

        const role = document.getRoleForUser(socket.userId);

        if (!role) {
          socket.emit("error", {
            message: "Access denied",
          });
          return;
        }

        socket.join(`doc:${documentId}`);

        socket.documentId = documentId;
        socket.documentRole = role;

        // Notify others
        socket.to(`doc:${documentId}`).emit("user-joined", {
          userId: socket.userId,
        });

        const room = io.sockets.adapter.rooms.get(`doc:${documentId}`);

        io.to(`doc:${documentId}`).emit("presence", {
          onlineUsers: room ? room.size : 1,
        });

        socket.emit("joined", {
          documentId,
          role,
          canWrite: canWrite(role),
          version: document.version,
        });
      } catch (err) {
        socket.emit("error", {
          message: err.message,
        });
      }
    });

    /*
     * Push operations
     */
    socket.on("push-operations", async ({ operations, clientId }) => {
      try {
        if (!socket.documentId) {
          socket.emit("error", {
            message: "Join a document first",
          });
          return;
        }

        if (!canWrite(socket.documentRole)) {
          socket.emit("error", {
            message: "Viewers cannot edit",
          });
          return;
        }

        const document = await Document.findById(socket.documentId);

        const result = await syncService.pushOperations(
          document,
          socket.userId,
          {
            operations,
            clientId,
          },
        );

        /*
         * Broadcast document update
         */
        io.to(`doc:${socket.documentId}`).emit("document-updated", {
          ...result,
          triggeredBy: socket.userId,
        });

        /*
         * Dashboard update
         */
        const dashboard = await dashboardService.getDashboard(socket.userId);

        io.to(`user:${socket.userId}`).emit("dashboard:update", dashboard);
      } catch (err) {
        socket.emit("error", {
          message: err.message,
        });
      }
    });

    /*
     * Leave document
     */
    socket.on("leave-document", () => {
      if (!socket.documentId) return;

      socket.to(`doc:${socket.documentId}`).emit("user-left", {
        userId: socket.userId,
      });

      socket.leave(`doc:${socket.documentId}`);

      const room = io.sockets.adapter.rooms.get(`doc:${socket.documentId}`);

      io.to(`doc:${socket.documentId}`).emit("presence", {
        onlineUsers: room ? room.size : 0,
      });

      socket.documentId = null;
      socket.documentRole = null;
    });

    /*
     * Disconnect
     */
    socket.on("disconnect", () => {
      if (socket.documentId) {
        socket.to(`doc:${socket.documentId}`).emit("user-left", {
          userId: socket.userId,
        });
      }

      console.log("Socket Disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = initSocket;

// const { Server } = require('socket.io');
// const Document = require('../models/document.model');
// const { verifyAccessToken } = require('../utils/jwt');
// const { canWrite } = require('../constants/roles');
// const syncService = require('../services/sync.service');

// const initSocket = (httpServer, corsOrigin) => {
//   const io = new Server(httpServer, {
//     cors: { origin: corsOrigin, credentials: true },
//   });

//   io.use(async (socket, next) => {
//     try {
//       const token =
//         socket.handshake.auth?.token ||
//         socket.handshake.headers?.authorization?.replace('Bearer ', '');

//       if (!token) return next(new Error('Authentication required'));

//       const decoded = verifyAccessToken(token);
//       socket.userId = decoded.userId;
//       next();
//     } catch {
//       next(new Error('Invalid token'));
//     }
//   });

//   io.on('connection', (socket) => {
//     socket.on('join-document', async ({ documentId }) => {
//       try {
//         const document = await Document.findById(documentId);
//         if (!document) {
//           socket.emit('error', { message: 'Document not found' });
//           return;
//         }

//         const role = document.getRoleForUser(socket.userId);
//         if (!role) {
//           socket.emit('error', { message: 'Access denied' });
//           return;
//         }

//         socket.join(`doc:${documentId}`);
//         socket.documentId = documentId;
//         socket.documentRole = role;

//         socket.emit('joined', {
//           documentId,
//           role,
//           canWrite: canWrite(role),
//           version: document.version,
//         });
//       } catch (err) {
//         socket.emit('error', { message: err.message });
//       }
//     });

//     socket.on('push-operations', async ({ operations, clientId }) => {
//       try {
//         if (!socket.documentId) {
//           socket.emit('error', { message: 'Join a document first' });
//           return;
//         }

//         if (!canWrite(socket.documentRole)) {
//           socket.emit('error', {
//             message: 'Viewers cannot push state updates',
//             code: 'FORBIDDEN',
//           });
//           return;
//         }

//         const document = await Document.findById(socket.documentId);
//         const result = await syncService.pushOperations(
//           document,
//           socket.userId,
//           { operations, clientId }
//         );

//         io.to(`doc:${socket.documentId}`).emit('document-updated', {
//           ...result,
//           triggeredBy: socket.userId,
//         });
//       } catch (err) {
//         socket.emit('error', { message: err.message });
//       }
//     });

//     socket.on('leave-document', () => {
//       if (socket.documentId) {
//         socket.leave(`doc:${socket.documentId}`);
//         socket.documentId = null;
//         socket.documentRole = null;
//       }
//     });

//     socket.on('disconnect', () => {});
//   });

//   return io;
// };

// module.exports = initSocket;

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const connectDB = require("./src/config/db");
const { port, clientOrigin } = require("./src/config/env");

const errorHandler = require("./src/middleware/error.middleware");

const initSocket = require("./src/socket");

const authRoutes = require("./src/routes/auth.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const documentRoutes = require("./src/routes/document.routes");
const syncRoutes = require("./src/routes/sync.routes");
const versionRoutes = require("./src/routes/version.routes");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO once
initSocket(server, clientOrigin);

app.use(cookieParser());

app.use(helmet());

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(morgan("dev"));

app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Collab Docs API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/versions", versionRoutes);

app.use(errorHandler);

const start = async () => {
  await connectDB();

  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

start();

const http = require("http");
const logger = require("morgan");
const express = require("express");
const app = express();
const server = http.createServer(app);
const mongoose = require("mongoose");
require("dotenv/config.js");
const { regModel } = require("./models/regModel");
const socketController = require("./controllers/socket.controller");

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Socket io implementation start

const io = require("socket.io")(server);

io.on("connection", async (socket) => {
  console.log("::::::::::::::::::NEW CONNECTION:::::::::::::::::");
  socket.on("login", (data) => socketController.handleLogin(data, socket, io));
  socket.on("message", (data) => socketController.handleMessage(data, socket, io));
  socket.on("room", (data) => socketController.handleMessageRoom(data, socket, io));
  socket.on("chat", (data) => socketController.handleChat(data, socket, io));
  socket.on("deletechat", (data) => socketController.handleDeleteChat(data, socket, io));
  socket.on("seen", (data) => socketController.handleSeen(data, socket, io));
  socket.on("disconnect", async () => await regModel.updateOne({ socketId: socket.id }, { $set: { socketId: null } }));
});

// Socket io implementation finish

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger("dev"));
const PORT = process.env.PORT || 3001;

// routes
const index_routes = require("./routes/index.routes");

app.use("/api/v1", index_routes);

// db connection
mongoose.connect("mongodb://0.0.0.0:27017/userData").then(() => console.log("MongoDb : START"));

server.listen(PORT, console.log(`Server @${PORT}`));

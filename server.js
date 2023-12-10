//npm init -y
//npm install express socket.io highlight.js
//sqlite3
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
//const hljs = require('highlight.js');
const sqlite3 = require("sqlite3").verbose(); // Import SQLite library

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  transports: ["websocket", "polling"],
});
// const io = socketIO(server);

// Connect to SQLite database 
const db = new sqlite3.Database("DataBase.db", (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connected to the in-memory SQlite database.");
});


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

app.get("/codeBlock/:id", (req, res) => {
  const blockId = req.params.id;

  db.get("SELECT * FROM codeBlocks WHERE ID = ?", [blockId], (err, row) => {
    if (err || !row) {
      return res.status(404).send("Code block not found");
    }

    res.sendFile(path.join(__dirname, "public", "codeBlock.html"));
  });
});

// Set up a route for the lobby pahe (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

//const codeBlockData = new Map();

let mentorSocket = null; // To store the mentor's socket // global value

// Handle connections with socket
io.on("connection", (socket) => {
  // Set default role to 'student'
  socket.role = "student";

  db.all("SELECT * FROM codeBlocks", (err, rows) => {
    if (!err) {
      socket.emit("codeBlocks", rows);
    }
  });

  // Map to store code data for each code block

  // Emit code block data to the client when they join the code block page
  socket.on("joinCodeBlock", ({ blockIndex }) => {
    if (!mentorSocket) {
      // The first user is a mentor
      mentorSocket = socket.id;
      socket.role = "mentor";
      console.log("Mentor joined:", mentorSocket); // Log mentor's socket ID
      console.log("Mentor socket.id:", socket.id);
    } else {
      // Others are students
      socket.role = "student";
    }

    console.log("User role:", socket.role); // Log the user's role
    console.log("User socket.id:", socket.id);

    // Join a room corresponding to the code block index
    socket.join(blockIndex);

    // Retrieve code block from the database

    db.get(
      "SELECT * FROM codeBlocks WHERE ID = ?",
      [blockIndex],
      (err, row) => {
        if (!err && row) {
          socket.emit("initialCodeBlockData", { ...row, role: socket.role });
          socket.emit("mentorSocket", mentorSocket); // Send mentor's socket ID to the client
        }
      }
    );
  });

  // Handle code changes
  socket.on("codeChange", (data) => {
    // Broadcast the code change to all connected clients
    //socket.broadcast.emit('codeChange', data);

    // Broadcast the code change only to clients interested in the specific code block
    io.to(data.blockIndex).emit("codeChange", data);

    db.get(
      "SELECT solution FROM codeBlocks WHERE ID = ?",
      [data.blockIndex],
      (err, row) => {
        if (!err && row) {
          const solutionCode = row.solution;

          // Remove spaces and line breaks for comparison
          const userCodeWithoutSpaces = data.code.replace(/\s/g, "");
          const solutionWithoutSpaces = solutionCode.replace(/\s/g, "");

          console.log(userCodeWithoutSpaces);

          // Check if the code matches the solution
          if (userCodeWithoutSpaces === solutionWithoutSpaces) {
            io.to(data.blockIndex).emit(
              "displaySmiley",
              "😊 Code matches the solution! 😊"
            );
          } else {
            io.to(data.blockIndex).emit("displaySmiley", " ");
          }
        }
      }
    );
  });

  //Handle disconnections
  //Ensure that the mentorSocket is set to null when a mentor disconnects
  // to allow the next connected user to become the mentor
  socket.on("disconnect", () => {
    if (socket.id === mentorSocket) {
      mentorSocket = null;
      console.log("Mentor disconnected");
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

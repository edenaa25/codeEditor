const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const sqlite3 = require("sqlite3").verbose(); // Import SQLite library for DB

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Connect to SQLite database
const db = new sqlite3.Database("DataBase.db", (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connected to the in-memory SQlite database.");
});

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

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let mentorSocket = null; // To store the mentor's socket // global value

io.on("connection", (socket) => {
  // Set default role to 'student'
  socket.role = "student";

  db.all("SELECT * FROM codeBlocks", (err, rows) => {
    if (!err) {
      socket.emit("codeBlocks", rows);
    }
  });

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

    console.log("User role:", socket.role);
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

  socket.on("codeChange", (data) => {
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

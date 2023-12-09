document.addEventListener("DOMContentLoaded", function () {
  const socket = io();

  // Get the code block index from the URL
  const blockIndex = window.location.pathname.split("/").pop();

  // Emit that the user has joined the code block page
  socket.emit("joinCodeBlock", { blockIndex });

  let mentorSocketId;

  // Create CodeMirror instance
  const codeEditor = CodeMirror(document.getElementById("codeEditor"), {
    value: "", // Initial code content
    mode: "javascript",
    lineNumbers: true,
    theme: "default",
    indentUnit: 2,
    readOnly: true, // Initial read-only for everyone
  });

  // Listen for the initial code block data
  socket.on("initialCodeBlockData", (data) => {
    // Display the code block title+ h1 + <p>
    document.getElementById("h1").innerText =
      "Code Block " + data.title + " Function";
    document.title = `Code Block - ${data.title}`;
    document.getElementById("explanation").innerText = data.explanation;
    // Set the initial code in the CodeMirror editor
    codeEditor.setValue(data.code);
  });

  // Listen for mentor's socket ID
  socket.on("mentorSocket", (mentorSocket) => {
    mentorSocketId = mentorSocket;
    // If the current user is the mentor, allow editing
    if (socket.id === mentorSocketId) {
      codeEditor.setOption("readOnly", true);
    } else {
      codeEditor.setOption("readOnly", false);
    }
  });

  // Debounce the code change events using lodash's debounce
  const debouncedCodeChange = _.debounce((newCode) => {
    socket.emit("codeChange", { blockIndex, code: newCode });
  }, 500); // Adjust the debounce delay as needed

  // Listen for real-time code changes
  socket.on("codeChange", (data) => {
    // Update the code in the CodeMirror editor
    const currentCode = codeEditor.getValue();

    // Only update if the code is different to avoid unnecessary changes
    if (currentCode !== data.code) {
      codeEditor.setValue(data.code);
    }

    // If the current user is not the mentor, update the editor based on role
    if (socket.id !== mentorSocketId) {
      codeEditor.setOption("readOnly", false);
    }
  });

  codeEditor.on("change", function () {
    const newCode = codeEditor.getValue();
    debouncedCodeChange(newCode);
  });

  // Display smiley when code matches solution
  socket.on("displaySmiley", (smile) => {
    document.getElementById("correctAnswer").innerText = smile;
  });

  // Handle local code changes and emit them to the server
  // codeEditor.on('change',  function () {
  //   const newCode = codeEditor.getValue();
  //   socket.emit('codeChange', { blockIndex, code: newCode });
  // });

  // Debounce the code change events
});

document.addEventListener("DOMContentLoaded", function () {
  const socket = io();

  // Get the code block index from the URL
  const blockIndex = window.location.pathname.split("/").pop();

  // Emit that the user has joined the code block page
  socket.emit("joinCodeBlock", { blockIndex });

  let mentorSocketId;

  // Create and append HTML elements
  const h1 = document.getElementById("h1");
  const explanation = document.getElementById("explanation");
  const goodLuckParagraph = document.getElementById("goodLuckParagraph");
  const correctAnswer = document.getElementById("correctAnswer");

  const codeEditorContainer = document.getElementById("codeEditor");

  // Create CodeMirror instance
  const codeEditor = CodeMirror(codeEditorContainer, {
    value: "", // Initial code content
    mode: "javascript",
    lineNumbers: true,
    theme: "default",
    indentUnit: 2,
    //readOnly: true, // Initial read-only for everyone
  });

  // Listen for the initial code block data
  socket.on("initialCodeBlockData", (data) => {
    h1.textContent = "Code Block " + data.title + " Function";
    document.title = `Code Block - ${data.title}`;
    explanation.textContent = data.explanation;

    codeEditor.setValue(data.code);
  });

  // Listen for mentor's socket ID
  socket.on("mentorSocket", (mentorSocket) => {
    mentorSocketId = mentorSocket;
    // If the current user is the student, allow editing
    if (socket.id === mentorSocketId) {
      goodLuckParagraph.innerHTML = "<strong>You are in a mentor role</strong>";
      codeEditor.setOption("readOnly", true);
    } else {
      goodLuckParagraph.innerHTML = "<strong>Good luck champion!</strong>";
      codeEditor.setOption("readOnly", false);
    }
  });

  // Debounce the code change events using lodash's debounce - the delay help for a good sync
  const debouncedCodeChange = _.throttle((newCode) => {
    socket.emit("codeChange", { blockIndex, code: newCode });
  }, 1000); // Adjust the debounce delay as needed

  // Listen for real-time code changes
  socket.on("codeChange", (data) => {
    console.log("data.code obj from codeChange func code block : " + data.code);

    const currentCode = codeEditor.getValue();

    console.log("currentCode from codeChange func codeblock: " + currentCode);

    // let savedSelection;

    // Only update if the code is different to avoid unnecessary changes
    if (currentCode !== data.code) {
      // Save cursor position before updating code
      // codeEditor.setValue(data.code);
      const cursor = codeEditor.getCursor();
      // Restore cursor position if cursor is defined
      if (cursor) {
        codeEditor.setValue(data.code);
        codeEditor.focus();
        codeEditor.setCursor(cursor);
      }
    }
    // If the current user is not the mentor, update the editor based on role
    if (socket.id !== mentorSocketId) {
      codeEditor.setOption("readOnly", false);
    }
  });

  // Display smiley when code matches solution
  socket.on("displaySmiley", (smile) => {
    correctAnswer.textContent = smile;
  });

  //Handle local code changes and emit them to the server
  codeEditor.on("change", function () {
    const newCode = codeEditor.getValue();
    debouncedCodeChange(newCode);
    console.log("Change func from code block: " + newCode);
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const socket = io();

  // Get the code block index from the URL
  const blockIndex = window.location.pathname.split("/").pop();

  // Emit that the user has joined the code block page
  socket.emit("joinCodeBlock", { blockIndex });

  let mentorSocketId;
  let mySocketId;
  let emitCodeChange = true;

  // Create and append HTML elements
  const h1 = document.getElementById("h1");
  const explanation = document.getElementById("explanation");
  const goodLuckParagraph = document.getElementById("goodLuckParagraph");
  const correctAnswer = document.getElementById("correctAnswer");

  const codeEditorContainer = document.getElementById("codeEditor");

  // Create CodeMirror instance
  const codeEditor = CodeMirror.fromTextArea(codeEditorContainer, {
    value: "",
    mode: "javascript",
    lineNumbers: true,
    theme: "default",
    indentUnit: 2,
  });

  socket.on("initialCodeBlockData", (data) => {
    h1.textContent = "Code Block " + data.title + " Function";
    document.title = `Code Block - ${data.title}`;
    explanation.textContent = data.explanation;
    mySocketId = socket.id;
    codeEditor.setValue(data.code);
  });

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

  socket.on("codeChange", (data) => {
    const currentCode = codeEditor.getValue();
    const cursor = codeEditor.getCursor();

    if (currentCode !== data.code && data.socketSender != mySocketId) {
      emitCodeChange = false;
      codeEditor.setValue(data.code);
      codeEditor.setCursor(cursor);
    }

    if (socket.id !== mentorSocketId) {
      codeEditor.setOption("readOnly", false);
    }
  });

  socket.on("displaySmiley", (smile) => {
    correctAnswer.textContent = smile;
  });

  codeEditor.on("change", function () {
    // If I am a student, send the change
    if (socket.id !== mentorSocketId && emitCodeChange) {
      const newCode = codeEditor.getValue();
      socket.emit("codeChange", {
        socketSender: mySocketId,
        blockIndex,
        code: newCode,
      });
    }
    emitCodeChange = true;
  });
});

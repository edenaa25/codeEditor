document.addEventListener("DOMContentLoaded", function () {
  const socket = io();

  // Get the code block index from the URL
  const blockIndex = window.location.pathname.split("/").pop();

  // Emit that the user has joined the code block page
  socket.emit("joinCodeBlock", { blockIndex });

  let mentorSocketId;

  // Create and append HTML elements
  const h1 = document.createElement("h1");
  h1.id = "h1";
  document.body.appendChild(h1);

  const explanation = document.createElement("p");
  explanation.id = "explanation";
  document.body.appendChild(explanation);

  const goodLuckParagraph = document.createElement("p");
  explanation.id = "goodLuckParagraph";
  document.body.appendChild(goodLuckParagraph);

  const correctAnswer = document.createElement("p");
  correctAnswer.id = "correctAnswer";
  document.body.appendChild(correctAnswer);

  const codeEditorContainer = document.createElement("div");
  codeEditorContainer.id = "codeEditor";
  document.body.appendChild(codeEditorContainer);

  // Create CodeMirror instance
  const codeEditor = CodeMirror(codeEditorContainer, {
    value: "", // Initial code content
    mode: "javascript",
    lineNumbers: true,
    theme: "default",
    indentUnit: 2,
    readOnly: true, // Initial read-only for everyone
  });

  // Listen for the initial code block data
  socket.on("initialCodeBlockData", (data) => {
    //DATA is a row from database
    // Display the code block title+ h1 + <p>
    h1.textContent = "Code Block " + data.title + " Function";
    document.title = `Code Block - ${data.title}`;
    explanation.textContent = data.explanation;
    // Set the initial code in the CodeMirror editor
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

  // Debounce the code change events using lodash's debounce- the delay help for a good sync
  const debouncedCodeChange = _.debounce((newCode) => {
    socket.emit("codeChange", { blockIndex, code: newCode });
  }, 250); // Adjust the debounce delay as needed

  // Listen for real-time code changes
  socket.on("codeChange", (data) => {
    console.log("data.code obj from codeChange func code block : " + data.code);
    // Update the code in the CodeMirror editor
    const currentCode = codeEditor.getValue();
    console.log("currentCode from codeChange func codeblock: " + currentCode);

    // Only update if the code is different to avoid unnecessary changes
    if (currentCode !== data.code) {
      codeEditor.setValue(data.code);
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

  // Handle local code changes and emit them to the server
  codeEditor.on("change", function () {
    const newCode = codeEditor.getValue();
    debouncedCodeChange(newCode);
    console.log("newCode change func from code block: " + newCode);
  });
});

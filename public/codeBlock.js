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
<<<<<<< HEAD
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
=======
  const codeEditorContainer = document.getElementById("codeEditorContainer");
  const codeEditor = document.getElementById("codeEditor");
>>>>>>> 87a85a5188aae2a16e8d1e4c27f0d742276ddf83

  // Listen for the initial code block data
  socket.on("initialCodeBlockData", (data) => {
    h1.textContent = "Code Block " + data.title + " Function";
    document.title = `Code Block - ${data.title}`;
    explanation.textContent = data.explanation;

    codeEditor.innerText = data.code;
    hljs.highlightElement(codeEditor);
  });

  // Listen for mentor's socket ID
  socket.on("mentorSocket", (mentorSocket) => {
    mentorSocketId = mentorSocket;
    // If the current user is the student, allow editing
    if (socket.id === mentorSocketId) {
      goodLuckParagraph.innerHTML = "<strong>You are in a mentor role</strong>";
      codeEditor.contentEditable = "false";
      // codeEditor.setAttribute("contenteditable", "false");
    } else {
      goodLuckParagraph.innerHTML = "<strong>Good luck champion!</strong>";
      codeEditor.contentEditable = "true";
      // codeEditor.setAttribute("contenteditable", "true");
    }
  });

  // Debounce the code change events using lodash's debounce - the delay help for a good sync
  const debouncedCodeChange = _.throttle((newCode) => {
    socket.emit("codeChange", { blockIndex, code: newCode });
  }, 700); // Adjust the debounce delay as needed

  // Listen for real-time code changes
  socket.on("codeChange", (data) => {
    console.log("data.code obj from codeChange func code block : " + data.code);

    const currentCode = codeEditor.textContent;

    console.log("currentCode from codeChange func codeblock: " + currentCode);

<<<<<<< HEAD
    let savedSelection;

    // Only update if the code is different to avoid unnecessary changes
    // if (currentCode !== data.code) {
    //   codeEditor.setValue(data.code);
    // }

    // Only update if the code is different to avoid unnecessary changes
    if (currentCode !== data.code) {
      codeEditor.setValue(data.code);
=======
    // Unset dataset.highlighted
    codeEditor.removeAttribute("data-highlighted");

    // Save cursor position
    let savedSelection;

    if (socket.id !== mentorSocketId && currentCode !== data.code) {
      savedSelection = rangy.saveSelection();
    }

    // Only update if the code is different to avoid unnecessary changes
    if (currentCode !== data.code) {
      codeEditor.textContent = data.code;
>>>>>>> 87a85a5188aae2a16e8d1e4c27f0d742276ddf83
      // Restore cursor position if savedSelection is defined
      if (savedSelection) {
        rangy.restoreSelection(savedSelection);
      }
<<<<<<< HEAD
=======
      hljs.highlightElement(codeEditor);
>>>>>>> 87a85a5188aae2a16e8d1e4c27f0d742276ddf83
    }

    // If the current user is not the mentor, update the editor based on role
    if (socket.id !== mentorSocketId) {
      codeEditor.readOnly = false;
    }
    // rangy.restoreSelection(savedSelection);
  });

  // Display smiley when code matches solution
  socket.on("displaySmiley", (smile) => {
    correctAnswer.textContent = smile;
  });

  // Handle local code changes and emit them to the server
  codeEditorContainer.addEventListener("input", function () {
    const newCode = codeEditor.textContent;
    debouncedCodeChange(newCode);
    console.log("Change func from code block: " + newCode);
  });
});

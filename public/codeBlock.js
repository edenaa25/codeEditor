// document.addEventListener("DOMContentLoaded", function () {
//   const socket = io();

//   // Get the code block index from the URL
//   const blockIndex = window.location.pathname.split("/").pop();

//   // Emit that the user has joined the code block page
//   socket.emit("joinCodeBlock", { blockIndex });

//   let mentorSocketId;

//   // Create and append HTML elements
//   const h1 = document.getElementById("h1");
//   const explanation = document.getElementById("explanation");
//   const goodLuckParagraph = document.getElementById("goodLuckParagraph");
//   const correctAnswer = document.getElementById("correctAnswer");

//   const codeEditorContainer = document.getElementById("codeEditor");

//   // Create CodeMirror instance
//   const codeEditor = CodeMirror.fromTextArea(codeEditorContainer, {
//     value: "",
//     mode: "javascript",
//     lineNumbers: true,
//     theme: "default",
//     indentUnit: 2,
//   });

//   // Listen for the initial code block data
//   socket.on("initialCodeBlockData", (data) => {
//     h1.textContent = "Code Block " + data.title + " Function";
//     document.title = `Code Block - ${data.title}`;
//     explanation.textContent = data.explanation;

//     codeEditor.setValue(data.code);
//   });

//   // Listen for mentor's socket ID
//   socket.on("mentorSocket", (mentorSocket) => {
//     mentorSocketId = mentorSocket;
//     // If the current user is the student, allow editing
//     if (socket.id === mentorSocketId) {
//       goodLuckParagraph.innerHTML = "<strong>You are in a mentor role</strong>";
//       codeEditor.setOption("readOnly", true);
//     } else {
//       goodLuckParagraph.innerHTML = "<strong>Good luck champion!</strong>";
//       codeEditor.setOption("readOnly", false);
//     }
//   });

//   // Debounce the code change events using lodash's debounce - the delay help for a good sync
//   const debouncedCodeChange = _.throttle((newCode) => {
//     socket.emit("codeChange", { blockIndex, code: newCode });
//   }, 500);

//   // Listen for real-time code changes
//   socket.on("codeChange", (data) => {
//     const currentCode = codeEditor.getValue();

//     if (currentCode !== data.code) {
//       codeEditor.setValue(data.code);
//       codeEditor.focus();
//       codeEditor.setCursor(codeEditor.lineCount(), 0);
//     }

//     // If the current user is not the mentor, update the editor based on role
//     if (socket.id !== mentorSocketId) {
//       codeEditor.setOption("readOnly", false);
//     }
//   });

//   // Display smiley when code matches solution
//   socket.on("displaySmiley", (smile) => {
//     correctAnswer.textContent = smile;
//   });

//   //Handle local code changes and emit them to the server
//   codeEditor.on("change", function () {
//     const newCode = codeEditor.getValue();
//     debouncedCodeChange(newCode);
//   });
// });

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
  const codeEditor = CodeMirror.fromTextArea(codeEditorContainer, {
    value: "",
    mode: "javascript",
    lineNumbers: true,
    theme: "default",
    indentUnit: 2,
  });

  // Variable to store the cursor position
  let savedCursor;

  // Function to handle local code changes
  const localChangeHandler = function () {
    const newCode = codeEditor.getValue();
    debouncedCodeChange(newCode);
  };

  // Debounce the code change events using lodash's debounce
  const debouncedCodeChange = _.throttle((newCode) => {
    socket.emit("codeChange", {
      blockIndex,
      code: newCode,
      cursor: savedCursor,
    });
  }, 500);

  // Listen for real-time code changes
  socket.on("codeChange", (data) => {
    const currentCode = codeEditor.getValue();
    const cursor = codeEditor.getCursor();

    // Only update if the code is different to avoid unnecessary changes
    if (currentCode !== data.code) {
      const scrollPosition = codeEditor.getScrollInfo();
      const selection = codeEditor.getSelection();

      codeEditor.setValue(data.code);

      // Restore cursor position and selection
      codeEditor.setCursor(cursor);
      codeEditor.setSelection(selection.head, selection.anchor);

      // Restore scroll position
      codeEditor.scrollTo(scrollPosition.left, scrollPosition.top);
    }

    // If the current user is not the mentor, update the editor based on role
    if (socket.id !== mentorSocketId) {
      codeEditor.setOption("readOnly", false);
    }
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

  // Listen for the initial code block data
  socket.on("initialCodeBlockData", (data) => {
    h1.textContent = "Code Block " + data.title + " Function";
    document.title = `Code Block - ${data.title}`;
    explanation.textContent = data.explanation;

    codeEditor.setValue(data.code);
  });

  // Display smiley when code matches solution
  socket.on("displaySmiley", (smile) => {
    correctAnswer.textContent = smile;
  });

  // Attach local change event listener
  codeEditor.on("change", localChangeHandler);
});

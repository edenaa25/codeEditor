document.addEventListener("DOMContentLoaded", function () {
  const socket = io();

  // Listen for code blocks
  socket.on("codeBlocks", (codeBlocks) => {
    const codeBlockList = document.getElementById("codeBlockList");
    codeBlockList.innerHTML = "";

    // Populate the code block list
    codeBlocks.forEach((block, index) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `/codeBlock/${index}`;
      a.setAttribute("data-index", index);
      a.innerText = block.title;
      li.appendChild(a);
      codeBlockList.appendChild(li);
    });
  });

  // Handling the click event and navigating to the code block page
  document
    .getElementById("codeBlockList")
    .addEventListener("click", function (event) {
      if (event.target.tagName === "A") {
        event.preventDefault();
        const blockIndex = event.target.getAttribute("data-index");
        window.location.href = `/codeBlock/${blockIndex}`;
      }
    });
});

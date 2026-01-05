const token = localStorage.getItem("token");
if (!token) {
  alert("Please login again");
  window.location.href = "login.html";
}

const roomId = new URLSearchParams(window.location.search).get("roomId");
if (!roomId) {
  alert("Invalid room. Open notes from a room.");
  window.location.href = "dashboard.html";
}

const notesList = document.getElementById("notesList");
const fileInput = document.getElementById("fileInput");

const userId = JSON.parse(atob(token.split(".")[1])).id;

/* ================= LOAD NOTES ================= */

async function loadNotes() {
  try {
    const res = await fetch(`/api/notes/${roomId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const notes = await res.json();
    notesList.innerHTML = "";

    if (notes.length === 0) {
      notesList.innerHTML = "<p>No notes yet</p>";
      return;
    }

    notes.forEach(note => {
      const div = document.createElement("div");
      div.className = "note-item";

      div.innerHTML = `
        <a href="/uploads/${note.path}" download>
          📄 ${note.filename}
        </a>

        ${note.uploadedBy === userId ? `
          <button onclick="deleteNote('${note._id}')">🗑</button>
        ` : ""}
      `;

      notesList.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    alert("Failed to load notes");
  }
}

/* ================= UPLOAD ================= */

async function uploadNote() {
  const file = fileInput.files[0];
  if (!file) {
    alert("Select a file first");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`/api/notes/upload/${roomId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      throw new Error("Upload failed");
    }

    fileInput.value = "";
    loadNotes();

  } catch (err) {
    console.error(err);
    alert("Upload failed");
  }
}

/* ================= DELETE ================= */

async function deleteNote(noteId) {
  if (!confirm("Delete this file?")) return;

  try {
    await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    loadNotes();
  } catch (err) {
    console.error(err);
    alert("Delete failed");
  }
}

loadNotes();

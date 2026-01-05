const token = localStorage.getItem("token");
function getUserIdFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return JSON.parse(atob(token.split(".")[1])).id;
}

// HARD STOP if not logged in
if (!token) {
  window.location.href = "login.html";
}

const roomsContainer = document.getElementById("rooms");
const colors = ["c1", "c2", "c3", "c4", "c5"];

/* ================= LOAD ROOMS ================= */

async function loadRooms() {
  try {
    const res = await fetch("https://studyhub-yvhy.onrender.com/api/room/my", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch rooms");
    }

    const rooms = await res.json();
    roomsContainer.innerHTML = "";

    if (rooms.length === 0) {
      roomsContainer.innerHTML = "<p>No rooms yet</p>";
      return;
    }

    rooms.forEach((room, i) => {
  const div = document.createElement("div");
  div.className = `room-card ${colors[i % colors.length]}`;

  div.innerHTML = `
    <h3>${room.name}</h3>
    <p>Code: ${room.code}</p>

    ${room.owner === getUserIdFromToken() ? `
      <button class="delete-btn">🗑 Delete</button>
    ` : ""}
  `;

  div.querySelector("h3").onclick = () => {
    location.href = `room.html?roomId=${room._id}`;
  };

  // DELETE ROOM
  const deleteBtn = div.querySelector(".delete-btn");
  if (deleteBtn) {
    deleteBtn.onclick = async (e) => {
      e.stopPropagation();

      if (!confirm("Delete this room?")) return;

      await fetch(`/api/room/${room._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      loadRooms();
    };
  }

  roomsContainer.appendChild(div);
});


  } catch (err) {
    console.error(err);
    roomsContainer.innerHTML = "<p>Error loading rooms</p>";
  }
}

/* ================= CREATE ROOM ================= */

async function createRoomPrompt() {
  const name = prompt("Enter room name");
  if (!name) return;

  try {
    const res = await fetch("https://studyhub-yvhy.onrender.com/api/room/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    if (!res.ok) {
      throw new Error("Room creation failed");
    }

    await res.json();
    loadRooms();

  } catch (err) {
    alert("Room creation failed (Unauthorized)");
    console.error(err);
  }
}

/* ================= JOIN ROOM ================= */

async function joinRoomPrompt() {
  const code = prompt("Enter room code");
  if (!code) return;

  try {
    const res = await fetch("https://studyhub-yvhy.onrender.com/api/room/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ code })
    });

    if (!res.ok) throw new Error("Join failed");

    loadRooms();
  } catch (err) {
    alert("Invalid room code");
  }
}

loadRooms();

/* ================= SOCKET ================= */

const socket = io();
const roomId = new URLSearchParams(window.location.search).get("roomId");
socket.emit("joinRoom", roomId);

/* ================= VIDEO ================= */

let localStream;
let peerConnection;

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

async function startCall() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  localVideo.srcObject = localStream;
  await localVideo.play();

  peerConnection = new RTCPeerConnection(rtcConfig);

  localStream.getTracks().forEach(track =>
    peerConnection.addTrack(track, localStream)
  );

  peerConnection.ontrack = e => {
    remoteVideo.srcObject = e.streams[0];
  };

  peerConnection.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("ice", { roomId, candidate: e.candidate });
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", { roomId, offer });
}

socket.on("offer", async ({ offer }) => {
  peerConnection = new RTCPeerConnection(rtcConfig);

  peerConnection.ontrack = e => {
    remoteVideo.srcObject = e.streams[0];
  };

  peerConnection.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("ice", { roomId, candidate: e.candidate });
    }
  };

  await peerConnection.setRemoteDescription(offer);

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  localVideo.srcObject = localStream;
  await localVideo.play();

  localStream.getTracks().forEach(track =>
    peerConnection.addTrack(track, localStream)
  );

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", { roomId, answer });
});

socket.on("answer", async ({ answer }) => {
  await peerConnection.setRemoteDescription(answer);
});

socket.on("ice", async ({ candidate }) => {
  if (candidate) await peerConnection.addIceCandidate(candidate);
});

/* ================= WHITEBOARD ================= */

const canvas = document.getElementById("whiteboard");
const ctx = canvas.getContext("2d");

let drawing = false;
let currentTool = "pen";

/* 🔥 FIX: NEVER depend on layout size */
function initWhiteboard() {
  // Internal resolution (drawing buffer)
  canvas.width = 1200;
  canvas.height = 500;

  // Visual size
  canvas.style.width = "100%";
  canvas.style.height = "500px";

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

initWhiteboard();

/* 🔥 FIX: correct cursor → canvas mapping */
function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

/* DRAW EVENTS */
canvas.addEventListener("mousedown", e => {
  drawing = true;
  const { x, y } = getCanvasPos(e);

  ctx.beginPath();
  ctx.moveTo(x, y);

  socket.emit("draw", {
    roomId,
    type: "begin",
    x,
    y,
    tool: currentTool
  });
});

canvas.addEventListener("mousemove", e => {
  if (!drawing) return;
  const { x, y } = getCanvasPos(e);
  draw(x, y, currentTool, true);
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
  ctx.beginPath();
});

canvas.addEventListener("mouseleave", () => {
  drawing = false;
});

function draw(x, y, tool, emit) {
  ctx.lineWidth = tool === "eraser" ? 20 : 3;
  ctx.globalCompositeOperation =
    tool === "eraser" ? "destination-out" : "source-over";

  ctx.lineTo(x, y);
  ctx.stroke();

  if (emit) {
    socket.emit("draw", {
      roomId,
      type: "draw",
      x,
      y,
      tool
    });
  }
}

/* RECEIVE DRAW */
socket.on("draw", data => {
  if (data.type === "begin") {
    ctx.beginPath();
    ctx.moveTo(data.x, data.y);
  } else if (data.type === "draw") {
    draw(data.x, data.y, data.tool, false);
  }
});

/* TOOLS */
function setTool(tool) {
  currentTool = tool;
}

function clearBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit("clearBoard", roomId);
}

socket.on("clearBoard", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

/* ================= CHAT ================= */

const userEmail = localStorage.getItem("userEmail") || "Anonymous";

function sendMessage() {
  const input = document.getElementById("messageInput");
  if (!input.value) return;

  socket.emit("chat", {
    roomId,
    message: input.value,
    email: userEmail
  });

  input.value = "";
}

socket.on("chat", data => {
  const div = document.createElement("div");
  div.innerHTML = `<b>${data.email}</b>: ${data.message}`;
  document.getElementById("messages").appendChild(div);
});

/* ================= CONTROLS ================= */

function toggleCamera() {
  if (!localStream) return;
  const track = localStream.getVideoTracks()[0];
  track.enabled = !track.enabled;
}

function toggleMic() {
  if (!localStream) return;
  const track = localStream.getAudioTracks()[0];
  track.enabled = !track.enabled;
}

function leaveCall() {
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
  }

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  socket.disconnect();
  window.location.href = "dashboard.html";
}

window.addEventListener("beforeunload", () => {
  if (localStream) localStream.getTracks().forEach(t => t.stop());
  if (peerConnection) peerConnection.close();
  socket.disconnect();
});

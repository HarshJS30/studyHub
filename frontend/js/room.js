const roomId = new URLSearchParams(location.search).get("roomId");

function goNotes() {
  location.href = `notes.html?roomId=${roomId}`;
}

function goConference() {
  location.href = `conference.html?roomId=${roomId}`;
}

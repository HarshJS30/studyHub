const API = "https://studyhub-yvhy.onrender.com/api/auth";

/* ================= SEND OTP (SIGN UP) ================= */

function sendOtp() {
  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const role = document.getElementById("role");
  const error = document.getElementById("error");

  error && (error.textContent = "");

  if (!email.value || !password.value) {
    error && (error.textContent = "Please fill all required fields");
    return;
  }

  // Save signup data temporarily
  localStorage.setItem(
    "signup",
    JSON.stringify({
      name: name ? name.value : "",
      email: email.value,
      password: password.value,
      role: role ? role.value : "user"
    })
  );

  fetch(`${API}/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.value })
  })
    .then(res => res.json())
    .then(data => {
      if (data.message && data.message.toLowerCase().includes("error")) {
        throw new Error(data.message);
      }
      location.href = "otp.html";
    })
    .catch(err => {
      error && (error.textContent = err.message || "Failed to send OTP");
    });
}

/* ================= VERIFY OTP ================= */

function verifyOtp() {
  const otp = document.getElementById("otp");
  const error = document.getElementById("error");

  error && (error.textContent = "");

  const data = JSON.parse(localStorage.getItem("signup"));
  if (!data || !otp.value) {
    error && (error.textContent = "Invalid OTP request");
    return;
  }

  fetch(`${API}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, otp: otp.value })
  })
    .then(r => r.json())
    .then(res => {
      if (!res.token) {
        throw new Error(res.message || "OTP verification failed");
      }

      localStorage.setItem("token", res.token);
      localStorage.setItem("userEmail", data.email);
      localStorage.removeItem("signup");

      location.href = "dashboard.html";
    })
    .catch(err => {
      error && (error.textContent = err.message || "Invalid OTP");
    });
}

/* ================= LOGIN ================= */

function login() {
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const error = document.getElementById("error");

  error && (error.textContent = "");

  if (!email.value || !password.value) {
    error && (error.textContent = "Email and password required");
    return;
  }

  fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.value,
      password: password.value
    })
  })
    .then(r => r.json())
    .then(res => {
      if (!res.token) {
        throw new Error(res.message || "Login failed");
      }

      localStorage.setItem("token", res.token);
      localStorage.setItem("userEmail", email.value);

      location.href = "dashboard.html";
    })
    .catch(err => {
      error && (error.textContent = err.message || "Login error");
    });
}

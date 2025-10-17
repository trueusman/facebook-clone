const USERS_KEY = "users";
const LOGGED_IN_KEY = "loggedInUser";

/* --- Local Storage Utilities --- */
function getUsers() {
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  const username = localStorage.getItem(LOGGED_IN_KEY);
  if (!username) return null;
  return getUsers().find((u) => u.username === username);
}

function updateAndSaveUser(updatedUser) {
  const users = getUsers();
  const index = users.findIndex((u) => u.username === updatedUser.username);
  if (index !== -1) {
    users[index] = updatedUser;
    saveUsers(users);
  }
}

// Helper function to get a user by username
function getUserByUsername(username) {
  return getUsers().find((u) => u.username === username);
}

/* --- View Controls --- */
function showPage(pageId) {
  document
    .querySelectorAll(".page-section")
    .forEach((sec) => (sec.style.display = "none"));
  document.getElementById(pageId).style.display = "flex";
}

function toggleAuthForm(showLogin) {
  document
    .getElementById("login-form")
    .classList.toggle("form-hidden", !showLogin);
  document
    .getElementById("signup-form")
    .classList.toggle("form-hidden", showLogin);
  document.getElementById("login-form").reset();
  document.getElementById("signup-form").reset();
}

/* --- Auth Logic --- */
function handleSignup(e) {
  e.preventDefault();
  const firstname = document.getElementById("signup-firstname").value.trim();
  const surname = document.getElementById("signup-surname").value.trim();
  const username = document.getElementById("signup-username").value.trim();
  const password = document.getElementById("signup-password").value;
  const day = document.getElementById("birth-day").value;
  const month = document.getElementById("birth-month").value;
  const year = document.getElementById("birth-year").value;
  const gender =
    document.querySelector('input[name="gender"]:checked')?.value ||
    "Not specified";
  const birthdate = `${day}-${month}-${year}`;

  if (
    !firstname ||
    !surname ||
    !username ||
    !password ||
    !day ||
    !month ||
    !year
  ) {
    alert("Please fill all required fields.");
    return;
  }

  const users = getUsers();
  if (users.some((u) => u.username === username)) {
    alert("Email/Mobile number is already registered!");
    return;
  }

  const newUser = {
    username,
    password,
    firstname,
    surname,
    gender,
    birthdate,
    friends: [],
    sentRequests: [],
    receivedRequests: [],
  };

  users.push(newUser);
  saveUsers(users);
  alert("Signup successful! Please log in.");
  toggleAuthForm(true);
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const user = getUsers().find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    localStorage.setItem(LOGGED_IN_KEY, username);
    showDashboard();
  } else {
    alert("Invalid email/password.");
  }
}

function handleLogout() {
  localStorage.removeItem(LOGGED_IN_KEY);
  showPage("auth-page");
}

/* --- Dashboard Rendering --- */
function renderDashboard(user) {
  // Left Sidebar Info
  document.getElementById(
    "sidebar-name"
  ).textContent = `${user.firstname} ${user.surname}`;
  document.getElementById("sidebar-details").textContent = user.gender;
  document.getElementById("friend-count").textContent = user.friends.length;
  document.getElementById("friends-list-count").textContent =
    user.friends.length;

  // Render Friend Sections
  renderFriendsList(user);
  renderFriendRequests(user);
  renderFriendSuggestions(user);
}

// FEATURE: Render the current user's friends list with unfriend button
function renderFriendsList(currentUser) {
  const container = document.getElementById("friends-list-container");
  container.innerHTML = "";

  if (currentUser.friends.length === 0) {
    container.innerHTML =
      '<p style="font-size:14px; color:#606770; margin:0;">No friends yet. Add some people!</p>';
    return;
  }

  currentUser.friends.forEach((friendUsername) => {
    const friend = getUserByUsername(friendUsername);
    if (!friend) return;

    const div = document.createElement("div");
    div.classList.add("friend-card");
    div.innerHTML = `
                    <h4>${friend.firstname} ${friend.surname}</h4>
                    <button class="unfriend-btn" onclick="handleUnfriend('${friend.username}')">Unfriend</button>
                    `;
    container.appendChild(div);
  });
}

function renderFriendRequests(currentUser) {
  const container = document.getElementById("request-list-container");
  container.innerHTML = "";

  const requests = currentUser.receivedRequests
    .map((username) => getUserByUsername(username))
    .filter(Boolean);

  if (requests.length === 0) {
    container.innerHTML =
      '<p style="font-size:14px; color:#606770; margin:0;">No new requests.</p>';
    return;
  }

  requests.forEach((user) => {
    const div = document.createElement("div");
    div.classList.add("friend-card");
    div.innerHTML = `
                    <h4>${user.firstname} ${user.surname}</h4>
                    <div>
                        <button class="accept-btn" onclick="handleAcceptRequest('${user.username}')">Confirm</button>
                        <button class="reject-btn" onclick="handleRejectRequest('${user.username}')">Delete</button>
                    </div>
                `;
    container.appendChild(div);
  });
}

// FEATURE: Render suggestions with Cancel Request button
function renderFriendSuggestions(currentUser) {
  const allUsers = getUsers();
  const container = document.getElementById("suggestion-list-container");
  container.innerHTML = "";

  const suggestions = allUsers.filter(
    (user) =>
      user.username !== currentUser.username &&
      !currentUser.friends.includes(user.username) &&
      !currentUser.receivedRequests.includes(user.username)
  );

  if (suggestions.length === 0) {
    container.innerHTML =
      '<p style="font-size:14px; color:#606770; margin:0;">No suggestions right now.</p>';
    return;
  }

  suggestions.slice(0, 5).forEach((user) => {
    const isSent = currentUser.sentRequests.includes(user.username);
    let buttonHTML;

    if (isSent) {
      // Display Cancel Request button
      buttonHTML = `<button class="reject-btn" style="color:#1c1e21;" onclick="handleCancelRequest('${user.username}')">Cancel Request</button>`;
    } else {
      // Display Add Friend button
      buttonHTML = `<button class="add-btn" onclick="handleSendRequest('${user.username}')">Add Friend</button>`;
    }

    const div = document.createElement("div");
    div.classList.add("friend-card");
    div.innerHTML = `
                    <h4>${user.firstname} ${user.surname}</h4>
                    ${buttonHTML}
                `;
    container.appendChild(div);
  });
}

/* --- Friend Logic --- */
window.handleSendRequest = function (targetUsername) {
  let currentUser = getCurrentUser();
  let targetUser = getUserByUsername(targetUsername);

  if (!targetUser) return;

  // Sender: Add to sentRequests
  currentUser.sentRequests.push(targetUsername);
  updateAndSaveUser(currentUser);

  // Receiver: Add to receivedRequests
  targetUser.receivedRequests.push(currentUser.username);
  updateAndSaveUser(targetUser);

  showDashboard();
};

// FEATURE: Handle Cancel Request
window.handleCancelRequest = function (targetUsername) {
  let currentUser = getCurrentUser();
  let targetUser = getUserByUsername(targetUsername);

  if (!targetUser) return;

  // Current User (Sender): Remove from sentRequests
  currentUser.sentRequests = currentUser.sentRequests.filter(
    (u) => u !== targetUsername
  );
  updateAndSaveUser(currentUser);

  // Target User (Receiver): Remove from receivedRequests
  targetUser.receivedRequests = targetUser.receivedRequests.filter(
    (u) => u !== currentUser.username
  );
  updateAndSaveUser(targetUser);

  showDashboard();
};

window.handleAcceptRequest = function (senderUsername) {
  let currentUser = getCurrentUser();
  let senderUser = getUserByUsername(senderUsername);

  if (!senderUser) return;

  // Current User (Accepts): Remove request, add friend
  currentUser.receivedRequests = currentUser.receivedRequests.filter(
    (u) => u !== senderUsername
  );
  currentUser.friends.push(senderUsername);
  updateAndSaveUser(currentUser);

  // Sender User: Remove request, add friend
  senderUser.sentRequests = senderUser.sentRequests.filter(
    (u) => u !== currentUser.username
  );
  senderUser.friends.push(currentUser.username);
  updateAndSaveUser(senderUser);

  showDashboard();
};

window.handleRejectRequest = function (senderUsername) {
  let currentUser = getCurrentUser();
  let senderUser = getUserByUsername(senderUsername);

  if (!senderUser) return;

  // Current User (Rejects): Remove request
  currentUser.receivedRequests = currentUser.receivedRequests.filter(
    (u) => u !== senderUsername
  );
  updateAndSaveUser(currentUser);

  // Sender User: Remove request
  senderUser.sentRequests = senderUser.sentRequests.filter(
    (u) => u !== currentUser.username
  );
  updateAndSaveUser(senderUser);

  showDashboard();
};

// FEATURE: Handle Unfriend
window.handleUnfriend = function (friendUsername) {
  if (!confirm(`Are you sure you want to unfriend this user?`)) return;

  let currentUser = getCurrentUser();
  let friendUser = getUserByUsername(friendUsername);

  if (!friendUser) return;

  // Current User: Remove friend
  currentUser.friends = currentUser.friends.filter((u) => u !== friendUsername);
  updateAndSaveUser(currentUser);

  // Friend User: Remove current user as friend
  friendUser.friends = friendUser.friends.filter(
    (u) => u !== currentUser.username
  );
  updateAndSaveUser(friendUser);

  showDashboard();
};

/* --- Initialization --- */
function showDashboard() {
  const user = getCurrentUser();
  if (!user) return showPage("auth-page");

  document.getElementById("dashboard-page").style.display = "flex";
  document.getElementById("auth-page").style.display = "none";

  renderDashboard(user);
}

function populateBirthdayFields() {
  const daySelect = document.getElementById("birth-day");
  const monthSelect = document.getElementById("birth-month");
  const yearSelect = document.getElementById("birth-year");

  // 1. Days (1 to 31)
  for (let i = 1; i <= 31; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    daySelect.appendChild(option);
  }

  // 2. Months
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  months.forEach((month) => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    monthSelect.appendChild(option);
  });

  // 3. Years (Current year down to 100 years ago)
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= currentYear - 100; i--) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    yearSelect.appendChild(option);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  populateBirthdayFields();

  if (localStorage.getItem(LOGGED_IN_KEY)) showDashboard();
  else showPage("auth-page");

  document
    .getElementById("signup-form")
    .addEventListener("submit", handleSignup);
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("logout-btn").addEventListener("click", handleLogout);
});

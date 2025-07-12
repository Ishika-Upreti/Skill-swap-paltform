const backendURL = "http://localhost:5000";

document.getElementById("profile-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = document.getElementById("profile-form");
  const formData = new FormData(form);

  const response = await fetch(`${backendURL}/api/users`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  alert("Profile created!");
  form.reset();
  loadUsers();
});

async function loadUsers() {
  const res = await fetch(`${backendURL}/api/users`);
  const users = await res.json();

  const container = document.getElementById("users-list");
  container.innerHTML = "";

  users.forEach(user => {
    const div = document.createElement("div");
    div.innerHTML = `
      <h3>${user.name}</h3>
      <p>${user.location}</p>
      <p>Skills Offered: ${user.skillsOffered.join(", ")}</p>
      <p>Skills Wanted: ${user.skillsWanted.join(", ")}</p>
      <p>Available: ${user.availability}</p>
      ${user.profilePhoto ? `<img src="data:image/jpeg;base64,${user.profilePhoto}" width="100" style="border-radius:50%;">` : ''}
    `;
    container.appendChild(div);
  });
}

loadUsers(); // 👈 Already called here

// ✅ ADD THIS BELOW `loadUsers()`:
document.getElementById("toggle-darkmode").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

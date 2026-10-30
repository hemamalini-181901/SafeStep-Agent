
// ========================================
// SAFESTEP - SMART MATERNAL SAFETY SYSTEM
// Frontend demonstration version
// ========================================

const $ = (id) => document.getElementById(id);

let isSignup = false;
let currentUser = null;
let currentView = "overview";
let monitoringChart = null;
let deviceConnected = false;

// Demo storage
let users = JSON.parse(localStorage.getItem("safestep_users") || "[]");
let patients = JSON.parse(localStorage.getItem("safestep_patients") || "[]");

// ========================================
// GENERAL HELPERS
// ========================================

function saveUsers() {
  localStorage.setItem("safestep_users", JSON.stringify(users));
}

function savePatients() {
  localStorage.setItem("safestep_patients", JSON.stringify(patients));
}

function showPage(pageId) {
  ["welcomePage", "authPage", "onboardingPage", "dashboardPage"]
    .forEach(id => $(id).classList.add("hidden"));

  $(pageId).classList.remove("hidden");
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2800);
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function getInitials(name = "User") {
  return name.trim().charAt(0).toUpperCase();
}

// ========================================
// LANDING PAGE
// ========================================

function openAuth() {
  isSignup = false;
  updateAuthMode();
  $("authMessage").textContent = "";
  showPage("authPage");
}

$("getStartedBtn").addEventListener("click", openAuth);
$("getStartedBtn2").addEventListener("click", openAuth);

$("learnMoreBtn").addEventListener("click", () => {
  document.querySelector(".landing-copy").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  showToast("SafeStep – Because Every Step Matters.");
});

$("learnMoreBtn2").addEventListener("click", () => {
  document.querySelector(".landing-features").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
});

$("authBack").addEventListener("click", () => {
  showPage("welcomePage");
});

// ========================================
// SIGNUP AND LOGIN
// ========================================

function updateAuthMode() {
  $("authTitle").textContent = isSignup
    ? "Create Your Account"
    : "Welcome Back!";

  $("authSubtitle").textContent = isSignup
    ? "Join SafeStep and experience connected maternal care."
    : "Sign in to continue your SafeStep journey.";

  $("authSubmit").textContent = isSignup
    ? "Create Account →"
    : "Sign In →";

  $("authSwitchText").textContent = isSignup
    ? "Already have an account?"
    : "Don't have an account?";

  $("authSwitchBtn").textContent = isSignup
    ? "Sign In"
    : "Sign Up";

  $("signupExtra").classList.toggle("hidden", !isSignup);
  $("signupRoleGroup").classList.toggle("hidden", !isSignup);

  $("authName").required = isSignup;
}

$("authSwitchBtn").addEventListener("click", () => {
  isSignup = !isSignup;
  $("authMessage").textContent = "";
  updateAuthMode();
});

$("authForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const email = $("authEmail").value.trim().toLowerCase();
  const password = $("authPassword").value;

  if (!email || !password) {
    $("authMessage").textContent = "Please enter your email and password.";
    return;
  }

  if (isSignup) {
    const name = $("authName").value.trim();
    const role = $("authRole").value;

    if (!name) {
      $("authMessage").textContent = "Please enter your name.";
      return;
    }

    if (users.some(user => user.email === email)) {
      $("authMessage").textContent =
        "This email already has an account. Please sign in.";
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      role,
      profileComplete: false,
      profile: null
    };

    users.push(newUser);
    saveUsers();

    currentUser = newUser;
    openOnboarding();

  } else {
    const foundUser = users.find(user =>
      user.email === email && user.password === password
    );

    if (!foundUser) {
      $("authMessage").textContent =
        "Invalid email or password. Please try again.";
      return;
    }

    currentUser = foundUser;

    if (foundUser.profileComplete && foundUser.profile) {
      currentUser.profile = foundUser.profile;
      openDashboard();
    } else {
      openOnboarding();
    }
  }

  $("authForm").reset();
});

// ========================================
// PROFILE SETUP
// ========================================

function openOnboarding() {
  $("onboardWelcome").textContent =
    `Welcome to SafeStep, ${currentUser.name}! Complete your profile.`;

  $("profileName").value = currentUser.name || "";

  $("profileRole").value = currentUser.role || "patient";

  toggleProfileFields();

  showPage("onboardingPage");
}

$("profileRole").addEventListener("change", toggleProfileFields);

function toggleProfileFields() {
  const role = $("profileRole").value;

  $("patientFields").classList.toggle("hidden", role !== "patient");
  $("doctorFields").classList.toggle("hidden", role !== "doctor");

  $("pregnancyMonth").required = role === "patient";
  $("specialization").required = role === "doctor";
}

$("profileForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const role = $("profileRole").value;

  const profile = {
    name: $("profileName").value.trim(),
    phone: $("profilePhone").value.trim(),
    age: $("profileAge").value,
    role
  };

  if (!profile.name || !profile.phone || !profile.age) {
    showToast("Please complete all required fields.");
    return;
  }

  if (role === "patient") {
    profile.pregnancyMonth = $("pregnancyMonth").value;
    profile.assignedDoctor = $("assignedDoctor").value.trim();

    if (!profile.pregnancyMonth) {
      showToast("Please select your pregnancy month.");
      return;
    }

  } else {
    profile.specialization = $("specialization").value.trim();
    profile.hospital = $("doctorCode").value.trim();

    if (!profile.specialization) {
      showToast("Please enter your specialization.");
      return;
    }
  }

  currentUser.name = profile.name;
  currentUser.role = role;
  currentUser.profile = profile;
  currentUser.profileComplete = true;

  users = users.map(user =>
    user.id === currentUser.id ? currentUser : user
  );

  saveUsers();

  if (role === "patient") {
    const alreadyAdded = patients.some(
      patient => patient.email === currentUser.email
    );

    if (!alreadyAdded) {
      patients.push({
        id: Date.now(),
        name: profile.name,
        email: currentUser.email,
        phone: profile.phone,
        age: profile.age,
        month: profile.pregnancyMonth,
        doctor: profile.assignedDoctor || "Not assigned",
        status: "Registered"
      });

      savePatients();
    }
  }

  openDashboard();
  showToast("Your SafeStep profile is ready!");
});

// ========================================
// DASHBOARD
// ========================================

function openDashboard() {
  showPage("dashboardPage");

  $("dashGreeting").textContent =
    `Welcome, ${currentUser.profile.name}!`;

  $("dashEyebrow").textContent =
    currentUser.role === "doctor"
      ? "DOCTOR PORTAL"
      : "PATIENT PORTAL";

  $("profileAvatar").textContent =
    getInitials(currentUser.profile.name);

  $("patientsNav").classList.toggle(
    "hidden",
    currentUser.role !== "doctor"
  );

  $("deviceNav").classList.toggle(
    "hidden",
    currentUser.role !== "patient"
  );

  currentView = "overview";
  setActiveNav("overview");
  renderDashboard();
}

function setActiveNav(view) {
  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === view
    );
  });
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    currentView = button.dataset.view;
    setActiveNav(currentView);
    renderDashboard();
  });
});

function renderDashboard() {
  if (!currentUser || !currentUser.profile) return;

  destroyChart();

  if (currentUser.role === "patient") {
    renderPatientDashboard();
  } else {
    renderDoctorDashboard();
  }
}

function destroyChart() {
  if (monitoringChart) {
    monitoringChart.destroy();
    monitoringChart = null;
  }
}

// ========================================
// PATIENT DASHBOARD
// ========================================

function renderPatientDashboard() {
  const profile = currentUser.profile;
  const content = $("dashboardContent");

  if (currentView === "device") {
    renderDevicePage();
    return;
  }

  if (currentView === "history") {
    renderHistoryPage();
    return;
  }

  if (currentView === "patients") {
    content.innerHTML = `
      <div class="panel">
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <h3>Patient Management</h3>
          <p>This section is available in the doctor portal.</p>
        </div>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <section class="welcome-banner">
      <div>
        <h2>Your Safety, Our Priority 💙</h2>
        <p>
          Welcome to your personal maternal safety dashboard.
          Stay connected and informed throughout your journey.
        </p>
      </div>
      <div class="banner-icon">🤰</div>
    </section>

    <section class="stats-grid">

      <div class="stat-card">
        <div class="stat-icon">🤰</div>
        <h3>Month ${escapeHTML(profile.pregnancyMonth)}</h3>
        <p>Current Pregnancy Stage</p>
      </div>

      <div class="stat-card">
        <div class="stat-icon">👨‍⚕️</div>
        <h3>${escapeHTML(profile.assignedDoctor || "Not assigned")}</h3>
        <p>Assigned Doctor</p>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⌚</div>
        <h3>${deviceConnected ? "Connected" : "Not Connected"}</h3>
        <p>SafeStep Wearable Status</p>
      </div>

    </section>

    <section class="content-grid">

      <div class="panel">
        <div class="panel-header">
          <h3>Monitoring Overview</h3>
          <span>DEMO DATA</span>
        </div>

        <div class="chart-container">
          <canvas id="monitoringChart"></canvas>
        </div>

        <p class="section-description">
          Illustrative sample data only. Not actual medical measurements.
        </p>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3>Device Connection</h3>
          <span class="status-pill ${deviceConnected ? "" : "offline"}">
            ${deviceConnected ? "Connected" : "Offline"}
          </span>
        </div>

        <div class="device-card">
          <div class="device-top">
            <div>
              <h4>SafeStep Wearable</h4>
              <p>Smart maternal safety device</p>
            </div>
            <div class="device-symbol">⌚</div>
          </div>

          <p>
            Connect your wearable to begin the device integration demo.
          </p>

          <button class="primary-btn" id="connectDeviceBtn">
            ${deviceConnected ? "Disconnect Device" : "Connect Device"}
          </button>
        </div>
      </div>

    </section>

    <section class="panel">
      <div class="panel-header">
        <h3>Your Profile</h3>
        <span class="status-pill">Profile Complete</span>
      </div>

      <div class="patient-list">

        <div class="patient-row">
          <div class="patient-info">
            <div class="patient-avatar">👤</div>
            <div>
              <strong>${escapeHTML(profile.name)}</strong>
              <small>${escapeHTML(currentUser.email)}</small>
            </div>
          </div>
        </div>

        <div class="patient-row">
          <div class="patient-info">
            <div class="patient-avatar">📞</div>
            <div>
              <strong>Phone Number</strong>
              <small>${escapeHTML(profile.phone)}</small>
            </div>
          </div>
        </div>

      </div>
    </section>
  `;

  drawMonitoringChart();
  attachDeviceButton();
}

// ========================================
// SAMPLE MONITORING CHART
// ========================================

function drawMonitoringChart() {
  const canvas = $("monitoringChart");

  if (!canvas || typeof Chart === "undefined") return;

  monitoringChart = new Chart(canvas, {
    type: "line",

    data: {
      labels: [
        "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
      ],

      datasets: [{
        label: "Sample Monitoring Index",
        data: [65, 70, 68, 74, 72, 78, 75],
        borderColor: "#3979e8",
        backgroundColor: "rgba(57,121,232,0.12)",
        fill: true,
        tension: 0.4,
        pointRadius: 4
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: true
        }
      },

      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// ========================================
// DEVICE CONNECTION DEMO
// ========================================

function attachDeviceButton() {
  const button = $("connectDeviceBtn");

  if (!button) return;

  button.addEventListener("click", () => {
    deviceConnected = !deviceConnected;

    showToast(
      deviceConnected
        ? "Demo device connected!"
        : "Demo device disconnected."
    );

    renderPatientDashboard();
  });
}

function renderDevicePage() {
  $("dashboardContent").innerHTML = `
    <h2 class="section-title">Device Connection</h2>

    <p class="section-description">
      Connect your SafeStep wearable and view its connection status.
    </p>

    <div class="panel form-panel">

      <div class="device-card">

        <div class="device-top">
          <div>
            <h4>SafeStep IoT Wearable</h4>
            <p>ESP8266 / NodeMCU device integration</p>
          </div>

          <div class="device-symbol">⌚</div>
        </div>

        <span class="status-pill ${deviceConnected ? "" : "offline"}">
          ${deviceConnected ? "Connected (Demo)" : "Not Connected"}
        </span>

        <p style="margin-top:15px">
          ${deviceConnected
            ? "The demo connection is active. Real hardware communication is not configured yet."
            : "Your wearable is currently not connected."}
        </p>

        <button class="primary-btn" id="devicePageConnect">
          ${deviceConnected ? "Disconnect Device" : "Connect Device"}
        </button>

      </div>

      <p class="section-description" style="margin-top:20px">
        Hardware Wi-Fi integration will be added in the next development stage.
      </p>

    </div>
  `;

  $("devicePageConnect").addEventListener("click", () => {
    deviceConnected = !deviceConnected;

    showToast(
      deviceConnected
        ? "Demo device connected!"
        : "Device disconnected."
    );

    renderDevicePage();
  });
}

// ========================================
// MONITORING HISTORY
// ========================================

function renderHistoryPage() {
  $("dashboardContent").innerHTML = `
    <h2 class="section-title">Monitoring History</h2>

    <p class="section-description">
      Review the sample activity history available in this demo.
    </p>

    <div class="panel">

      <div class="panel-header">
        <h3>Recent Activity</h3>
        <span>DEMO RECORDS</span>
      </div>

      <div class="table-wrap">
        <table class="data-table">

          <thead>
            <tr>
              <th>Activity</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Profile Created</td>
              <td>Today</td>
              <td><span class="status-pill">Completed</span></td>
            </tr>

            <tr>
              <td>Device Connection</td>
              <td>Today</td>
              <td>
                <span class="status-pill ${deviceConnected ? "" : "offline"}">
                  ${deviceConnected ? "Connected (Demo)" : "Not Connected"}
                </span>
              </td>
            </tr>

            <tr>
              <td>Monitoring Sample</td>
              <td>Today</td>
              <td><span class="status-pill warning">Illustrative</span></td>
            </tr>
          </tbody>

        </table>
      </div>

    </div>
  `;
}

// ========================================
// DOCTOR DASHBOARD
// ========================================

function getDoctorPatients() {
  return patients.filter(patient =>
    patient.doctor.toLowerCase() ===
    currentUser.profile.name.toLowerCase()
  );
}

function renderDoctorDashboard() {
  const content = $("dashboardContent");

  if (currentView === "patients") {
    renderDoctorPatients();
    return;
  }

  if (currentView === "history") {
    renderHistoryPage();
    return;
  }

  if (currentView === "device") {
    content.innerHTML = `
      <div class="panel">
        <div class="empty-state">
          <div class="empty-icon">⌚</div>
          <h3>Patient Device Monitoring</h3>
          <p>View device status through individual patient records when hardware integration is available.</p>
        </div>
      </div>
    `;
    return;
  }

  const doctorPatients = getDoctorPatients();

  content.innerHTML = `
    <section class="welcome-banner">
      <div>
        <h2>Welcome, Dr. ${escapeHTML(currentUser.profile.name)} 👋</h2>
        <p>
          Manage your patient registrations and stay connected
          with your maternal care community.
        </p>
      </div>
      <div class="banner-icon">🩺</div>
    </section>

    <section class="stats-grid">

      <div class="stat-card">
        <div class="stat-icon">👩‍🍼</div>
        <h3>${doctorPatients.length}</h3>
        <p>Registered Patients</p>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🏥</div>
        <h3>${escapeHTML(currentUser.profile.hospital || "Clinic")}</h3>
        <p>Hospital / Clinic</p>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🩺</div>
        <h3>${escapeHTML(currentUser.profile.specialization)}</h3>
        <p>Specialization</p>
      </div>

    </section>

    <section class="panel">

      <div class="panel-header">
        <h3>Recent Patients</h3>

        <button class="primary-btn" id="addPatientBtn">
          + Add Patient
        </button>
      </div>

      ${doctorPatients.length
        ? createPatientRows(doctorPatients.slice(-5))
        : `
          <div class="empty-state">
            <div class="empty-icon">👩‍⚕️</div>
            <h3>No Patients Yet</h3>
            <p>Add your first patient to get started.</p>
          </div>
        `
      }

    </section>
  `;

  $("addPatientBtn").addEventListener("click", renderAddPatientForm);
}

function createPatientRows(list) {
  return `
    <div class="patient-list">
      ${list.map(patient => `
        <div class="patient-row">

          <div class="patient-info">
            <div class="patient-avatar">
              ${escapeHTML(getInitials(patient.name))}
            </div>

            <div>
              <strong>${escapeHTML(patient.name)}</strong>
              <small>Pregnancy Month ${escapeHTML(patient.month)}</small>
            </div>
          </div>

          <span class="status-pill">
            ${escapeHTML(patient.status)}
          </span>

        </div>
      `).join("")}
    </div>
  `;
}

// ========================================
// DOCTOR: PATIENT MANAGEMENT
// ========================================

function renderDoctorPatients() {
  const list = getDoctorPatients();

  $("dashboardContent").innerHTML = `
    <h2 class="section-title">Patient Management</h2>

    <p class="section-description">
      Register and manage your maternal care patients.
    </p>

    <div class="panel">

      <div class="panel-header">
        <h3>My Patients (${list.length})</h3>

        <button class="primary-btn" id="addPatientBtn">
          + Add Patient
        </button>
      </div>

      ${list.length
        ? `
          <div class="table-wrap">
            <table class="data-table">

              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Phone</th>
                  <th>Month</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                ${list.map(patient => `
                  <tr>
                    <td><strong>${escapeHTML(patient.name)}</strong></td>
                    <td>${escapeHTML(patient.age)}</td>
                    <td>${escapeHTML(patient.phone)}</td>
                    <td>${escapeHTML(patient.month)}</td>
                    <td>${escapeHTML(patient.status)}</td>
                  </tr>
                `).join("")}
              </tbody>

            </table>
          </div>
        `
        : `
          <div class="empty-state">
            <div class="empty-icon">👩‍🍼</div>
            <h3>No Patients Registered</h3>
            <p>Use Add Patient to register your first patient.</p>
          </div>
        `
      }

    </div>
  `;

  $("addPatientBtn").addEventListener("click", renderAddPatientForm);
}

function renderAddPatientForm() {
  $("dashboardContent").innerHTML = `
    <h2 class="section-title">Register New Patient</h2>

    <p class="section-description">
      Enter the patient's details to add them to your SafeStep portal.
    </p>

    <div class="panel form-panel">

      <form id="addPatientForm">

        <div class="form-group">
          <label for="newPatientName">Patient Name</label>
          <input id="newPatientName" required placeholder="Full name">
        </div>

        <div class="form-grid">

          <div class="form-group">
            <label for="newPatientAge">Age</label>
            <input id="newPatientAge" type="number" min="18" required placeholder="Age">
          </div>

          <div class="form-group">
            <label for="newPatientPhone">Phone Number</label>
            <input id="newPatientPhone" type="tel" required placeholder="Phone">
          </div>

        </div>

        <div class="form-group">
          <label for="newPatientEmail">Email (Optional)</label>
          <input id="newPatientEmail" type="email" placeholder="Email address">
        </div>

        <div class="form-group">
          <label for="newPatientMonth">Pregnancy Month</label>
          <select id="newPatientMonth" required>
            <option value="">Select month</option>
            ${Array.from({ length: 9 }, (_, i) =>
              `<option value="${i + 1}">Month ${i + 1}</option>`
            ).join("")}
          </select>
        </div>

        <button type="submit" class="primary-btn full-btn">
          Register Patient →
        </button>

        <button type="button" class="secondary-btn full-btn" id="cancelPatientBtn">
          Cancel
        </button>

      </form>

    </div>
  `;

  $("cancelPatientBtn").addEventListener("click", () => {
    currentView = "patients";
    setActiveNav("patients");
    renderDoctorPatients();
  });

  $("addPatientForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const newPatient = {
      id: Date.now(),
      name: $("newPatientName").value.trim(),
      age: $("newPatientAge").value,
      phone: $("newPatientPhone").value.trim(),
      email: $("newPatientEmail").value.trim(),
      month: $("newPatientMonth").value,
      doctor: currentUser.profile.name,
      status: "Registered"
    };

    patients.push(newPatient);
    savePatients();

    showToast("Patient registered successfully!");

    currentView = "patients";
    setActiveNav("patients");
    renderDoctorPatients();
  });
}

// ========================================
// HELP AND SIGN OUT
// ========================================

$("helpBtn").addEventListener("click", () => {
  showToast("SafeStep demo support. Contact your project team for help.");
});

$("logoutBtn").addEventListener("click", () => {
  currentUser = null;
  deviceConnected = false;

  $("authForm").reset();

  showPage("welcomePage");
  showToast("You have signed out successfully.");
});

// ========================================
// INITIAL PAGE
// ========================================

showPage("welcomePage");
updateAuthMode();

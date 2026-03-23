// Configurações
const ADMIN_PASSWORD = "admin123"; // Senha do proprietário
const SCHEDULES_KEY = "schedules";
const LOGIN_KEY = "adminLoggedIn";

// DOM Elements
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const scheduleModal = document.getElementById("scheduleModal");
const loginModal = document.getElementById("loginModal");
const adminModal = document.getElementById("adminModal");
const modalOverlay = document.getElementById("modalOverlay");

// Função para recolher/expandir sidebar
function toggleSidebar() {
  sidebar.classList.toggle("collapsed");
  document.querySelector("main").classList.toggle("sidebar-collapsed");
  document.querySelector(".footer").classList.toggle("sidebar-collapsed");
  document.querySelector(".topbar").classList.toggle("sidebar-collapsed");
}

// Event Listeners - Menu lateral agora é fixo

// Funções do Modal de Agendamento
function openScheduleModal() {
  scheduleModal.classList.add("active");
  modalOverlay.classList.add("active");
  
  // Definir data mínima como hoje
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("calendarInput").min = today;
}

function closeScheduleModal() {
  scheduleModal.classList.remove("active");
}

// Funções do Modal de Login
function openLoginModal() {
  loginModal.classList.add("active");
  modalOverlay.classList.add("active");
  document.getElementById("adminPassword").value = "";
}

function closeLoginModal() {
  loginModal.classList.remove("active");
}

function validateLogin() {
  const password = document.getElementById("adminPassword").value;
  
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(LOGIN_KEY, "true");
    closeLoginModal();
    openAdminModal();
    showSchedules();
  } else {
    alert("Senha incorreta!");
  }
}

// Funções da Área Administrativa
function openAdminModal() {
  adminModal.classList.add("active");
  modalOverlay.classList.add("active");
}

function closeAdminModal() {
  adminModal.classList.remove("active");
  closeAllModals();
}

function logout() {
  sessionStorage.removeItem(LOGIN_KEY);
  closeAdminModal();
}

// Confirmar agendamento
function confirmSchedule() {
  const name = document.getElementById("clientName").value.trim();
  const email = document.getElementById("clientEmail").value.trim();
  const phone = document.getElementById("clientPhone").value.trim();
  const date = document.getElementById("calendarInput").value;
  const time = document.getElementById("timeInput").value;
  
  if (!name || !email || !phone || !date || !time) {
    alert("Por favor, preencha todos os campos!");
    return;
  }
  
  // Validar email simples
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Por favor, insira um email válido!");
    return;
  }
  
  // Criar agendamento
  const schedule = {
    id: Date.now(),
    name,
    email,
    phone,
    date,
    time,
    createdAt: new Date().toLocaleString("pt-BR")
  };
  
  // Guardar no localStorage
  let schedules = JSON.parse(localStorage.getItem(SCHEDULES_KEY)) || [];
  schedules.push(schedule);
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
  
  // Limpar formulário
  document.getElementById("clientName").value = "";
  document.getElementById("clientEmail").value = "";
  document.getElementById("clientPhone").value = "";
  document.getElementById("calendarInput").value = "";
  document.getElementById("timeInput").value = "";
  
  closeScheduleModal();
  alert("Agendamento realizado com sucesso! Você receberá uma confirmação por email.");
}

// Exibir agendamentos na área administrativa
function showSchedules() {
  const isLoggedIn = sessionStorage.getItem(LOGIN_KEY);
  
  if (!isLoggedIn) {
    alert("Acesso negado!");
    return;
  }
  
  const schedules = JSON.parse(localStorage.getItem(SCHEDULES_KEY)) || [];
  const schedulesList = document.getElementById("schedulesList");
  
  if (schedules.length === 0) {
    schedulesList.innerHTML = '<p class="no-schedules">Nenhum agendamento realizado.</p>';
    return;
  }
  
  schedulesList.innerHTML = "";
  
  // Ordenar por data e hora
  schedules.sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`);
    const dateTimeB = new Date(`${b.date}T${b.time}`);
    return dateTimeA - dateTimeB;
  });
  
  schedules.forEach(schedule => {
    const formatDate = new Date(schedule.date).toLocaleDateString("pt-BR");
    const item = document.createElement("div");
    item.className = "schedule-item";
    item.innerHTML = `
      <p><strong>Cliente:</strong> ${schedule.name}</p>
      <p><strong>Email:</strong> ${schedule.email}</p>
      <p><strong>Telefone:</strong> ${schedule.phone}</p>
      <p><strong>Data:</strong> ${formatDate}</p>
      <p><strong>Horário:</strong> ${schedule.time}</p>
      <p><strong>Agendado em:</strong> ${schedule.createdAt}</p>
      <button class="btn" style="margin-top: 0.5rem; background: #ff6b6b;" onclick="deleteSchedule(${schedule.id})">Remover</button>
    `;
    schedulesList.appendChild(item);
  });
}

// Remover agendamento específico
function deleteSchedule(id) {
  if (!confirm("Tem certeza que deseja remover este agendamento?")) {
    return;
  }
  
  let schedules = JSON.parse(localStorage.getItem(SCHEDULES_KEY)) || [];
  schedules = schedules.filter(s => s.id !== id);
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
  showSchedules();
}

// Limpar toda a agenda
function clearAllSchedules() {
  if (!confirm("Tem certeza que deseja limpar TODA a agenda? Esta ação não pode ser desfeita!")) {
    return;
  }
  
  localStorage.removeItem(SCHEDULES_KEY);
  showSchedules();
  alert("Agenda limpa com sucesso!");
}

// Fechar todos os modais
function closeAllModals() {
  scheduleModal.classList.remove("active");
  loginModal.classList.remove("active");
  adminModal.classList.remove("active");
  modalOverlay.classList.remove("active");
  sidebar.classList.remove("active");
}

// Fechar modais ao clicar no overlay
modalOverlay.addEventListener("click", closeAllModals);

// Fechar modais ao pressionar ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAllModals();
  }
});

// Impedir fechamento ao clicar dentro do modal
document.querySelectorAll(".modal-content").forEach(modal => {
  modal.addEventListener("click", (e) => {
    e.stopPropagation();
  });
});

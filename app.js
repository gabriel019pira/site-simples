// ========== CONFIGURAÇÃO LOCAL ==========
// Armazenagem local de agendamentos e credenciais (SEM dependência de API externa)

const ADMIN_PASSWORD = "admin123";
const SCHEDULES_KEY = "schedules";
const ADMIN_LOGIN_KEY = "adminLoggedIn";
const CLIENT_LOGIN_KEY = "clientLoggedIn";
const CLIENT_PHONE_KEY = "clientPhone";

console.log(`✅ Aplicação rodando em modo LOCAL (sem API externa)`);

// DOM Elements
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const scheduleModal = document.getElementById("scheduleModal");
const clientLoginModal = document.getElementById("clientLoginModal");
const adminLoginModal = document.getElementById("adminLoginModal");
const clientSchedulesModal = document.getElementById("clientSchedulesModal");
const adminModal = document.getElementById("adminModal");
const modalOverlay = document.getElementById("modalOverlay");

// Função para recolher/expandir sidebar
function toggleSidebar() {
  sidebar.classList.toggle("collapsed");
  document.querySelector("main").classList.toggle("sidebar-collapsed");
  document.querySelector(".footer").classList.toggle("sidebar-collapsed");
  document.querySelector(".topbar").classList.toggle("sidebar-collapsed");
}

// Função para limpar cache
function clearCache() {
  localStorage.clear();
  sessionStorage.clear();
  alert("✅ Cache limpo com sucesso! A página será recarregada.");
  location.reload();
}

// ========== FUNÇÕES AUXILIARES ==========
// Obter agendamentos do localStorage
function getSchedules() {
  const schedules = localStorage.getItem(SCHEDULES_KEY);
  return schedules ? JSON.parse(schedules) : [];
}

// Salvar agendamentos no localStorage
function saveSchedules(schedules) {
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
}

// Gerar ID único
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ========== HORÁRIOS DISPONÍVEIS ==========
// Função para atualizar horários disponíveis
function updateAvailableTimes() {
  const selectedDate = document.getElementById("calendarInput").value;
  const timeSelect = document.getElementById("timeInput");
  const bookedTimesInfo = document.getElementById("bookedTimes");
  const availableInfo = document.getElementById("availableInfo");
  
  if (!selectedDate) {
    bookedTimesInfo.textContent = "";
    availableInfo.textContent = "";
    Array.from(timeSelect.options).forEach(option => {
      if (option.value) option.disabled = false;
    });
    return;
  }
  
  // Buscar agendamentos para a data selecionada do localStorage
  const schedules = getSchedules();
  const bookedTimesArray = schedules
    .filter(s => s.date === selectedDate)
    .map(s => s.time);
  
  let disabledCount = 0;
  Array.from(timeSelect.options).forEach(option => {
    if (option.value) {
      const isBooked = bookedTimesArray.includes(option.value);
      option.disabled = isBooked;
      if (isBooked) {
        option.textContent = `${option.value} (INDISPONÍVEL)`;
        disabledCount++;
      } else {
        option.textContent = option.value;
      }
    }
  });
  
  const totalHours = Array.from(timeSelect.options).filter(o => o.value).length;
  const availableCount = totalHours - disabledCount;
  
  if (disabledCount > 0) {
    bookedTimesInfo.textContent = `⏳ Horários marcados: ${bookedTimesArray.join(", ")}`;
  } else {
    bookedTimesInfo.textContent = "";
  }
  
  availableInfo.textContent = `✅ ${availableCount} horários disponíveis`;
  
  if (timeSelect.value && bookedTimesArray.includes(timeSelect.value)) {
    timeSelect.value = "";
  }
}

// Chamar ao abrir o modal
function openScheduleModal() {
  scheduleModal.classList.add("active");
  modalOverlay.classList.add("active");
  
  // Definir data mínima como hoje
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("calendarInput").min = today;
  document.getElementById("calendarInput").value = today; // Pré-selecionar hoje
  
  // Atualizar horários disponíveis para hoje
  setTimeout(() => {
    updateAvailableTimes();
  }, 100);
}

function closeScheduleModal() {
  scheduleModal.classList.remove("active");
}

// Funções do Modal de Login do Cliente
function openClientLoginModal() {
  clientLoginModal.classList.add("active");
  modalOverlay.classList.add("active");
  document.getElementById("clientPhoneLogin").value = "";
}

function closeClientLoginModal() {
  clientLoginModal.classList.remove("active");
}

function validateClientLogin() {
  const phone = document.getElementById("clientPhoneLogin").value.trim();
  
  if (!phone) {
    alert("Por favor, digite seu telefone!");
    return;
  }
  
  // Verificar se o cliente tem agendamentos no localStorage
  const schedules = getSchedules();
  const hasSchedules = schedules.some(s => s.phone === phone);
  
  if (!hasSchedules) {
    alert("❌ Nenhum agendamento encontrado com este telefone");
    return;
  }
  
  // Fazer login
  sessionStorage.setItem(CLIENT_LOGIN_KEY, "true");
  sessionStorage.setItem(CLIENT_PHONE_KEY, phone);
  closeClientLoginModal();
  openClientSchedulesModal();
  showClientSchedules();
}

// Funções do Modal de Visualização de Agendamentos do Cliente
function openClientSchedulesModal() {
  clientSchedulesModal.classList.add("active");
  modalOverlay.classList.add("active");
}

function closeClientSchedulesModal() {
  clientSchedulesModal.classList.remove("active");
}

function logoutClient() {
  sessionStorage.removeItem(CLIENT_LOGIN_KEY);
  sessionStorage.removeItem(CLIENT_PHONE_KEY);
  closeClientSchedulesModal();
}

// Função para exibir agendamentos do cliente
function showClientSchedules() {
  const isLoggedIn = sessionStorage.getItem(CLIENT_LOGIN_KEY);
  const clientPhone = sessionStorage.getItem(CLIENT_PHONE_KEY);
  
  if (!isLoggedIn || !clientPhone) {
    alert("Acesso negado!");
    return;
  }
  
  const schedules = getSchedules();
  const mySchedules = schedules.filter(s => s.phone === clientPhone);
  
  const clientSchedulesList = document.getElementById("clientSchedulesList");
  
  if (mySchedules.length === 0) {
    clientSchedulesList.innerHTML = '<p class="no-schedules">Você não possui agendamentos.</p>';
    return;
  }
  
  clientSchedulesList.innerHTML = "";
  
  mySchedules.sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`);
    const dateTimeB = new Date(`${b.date}T${b.time}`);
    return dateTimeA - dateTimeB;
  });
  
  mySchedules.forEach(schedule => {
    const formatDate = new Date(schedule.date).toLocaleDateString("pt-BR");
    const item = document.createElement("div");
    item.className = "schedule-item";
    item.innerHTML = `
      <p><strong>Data:</strong> ${formatDate}</p>
      <p><strong>Horário:</strong> ${schedule.time}</p>
      <p><strong>Agendado em:</strong> ${schedule.createdAt}</p>
      <p style="font-size: 0.85rem; color: #999; margin-top: 0.5rem;">Para cancelar, entre em contato conosco.</p>
    `;
    clientSchedulesList.appendChild(item);
  });
}

// Funções do Modal de Login do Admin
function openAdminLoginModal() {
  adminLoginModal.classList.add("active");
  modalOverlay.classList.add("active");
  document.getElementById("adminPassword").value = "";
}

function closeAdminLoginModal() {
  adminLoginModal.classList.remove("active");
}

function validateAdminLogin() {
  const password = document.getElementById("adminPassword").value;
  
  if (password !== ADMIN_PASSWORD) {
    alert("❌ Senha incorreta!");
    return;
  }
  
  // Fazer login
  sessionStorage.setItem(ADMIN_LOGIN_KEY, "true");
  closeAdminLoginModal();
  openAdminModal();
  showAdminSchedules();
}

// Funções da Área Administrativa (Admin)
function openAdminModal() {
  adminModal.classList.add("active");
  modalOverlay.classList.add("active");
}

function closeAdminModal() {
  adminModal.classList.remove("active");
  closeAllModals();
}

function logoutAdmin() {
  sessionStorage.removeItem(ADMIN_LOGIN_KEY);
  closeAdminModal();
}

// Confirmar agendamento
async function confirmSchedule() {
  const name = document.getElementById("clientName").value.trim();
  const email = document.getElementById("clientEmail").value.trim();
  const phone = document.getElementById("clientPhone").value.trim();
  const date = document.getElementById("calendarInput").value;
  const time = document.getElementById("timeInput").value;
  
  if (!name || !email || !phone || !date || !time) {
    alert("Por favor, preencha todos os campos!");
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Por favor, insira um email válido!");
    return;
  }
  
  try {
    // Criar agendamento
    const schedules = getSchedules();
    const newSchedule = {
      id: generateId(),
      name,
      email,
      phone,
      date,
      time,
      createdAt: new Date().toLocaleString("pt-BR")
    };
    
    // Verificar se o horário já está ocupado
    const isTimeBooked = schedules.some(s => s.date === date && s.time === time);
    if (isTimeBooked) {
      alert("❌ Este horário não está mais disponível!");
      updateAvailableTimes();
      return;
    }
    
    // Salvar agendamento
    schedules.push(newSchedule);
    saveSchedules(schedules);
    
    // Limpar formulário
    document.getElementById("clientName").value = "";
    document.getElementById("clientEmail").value = "";
    document.getElementById("clientPhone").value = "";
    document.getElementById("calendarInput").value = "";
    document.getElementById("timeInput").value = "";
    
    closeScheduleModal();
    const formatDate = new Date(date).toLocaleDateString("pt-BR");
    alert(`✅ Agendamento realizado com sucesso!\n\n📅 Data: ${formatDate}\n⏰ Horário: ${time}\n👤 Cliente: ${name}`);
    
    // Atualizar disponibilidade
    updateAvailableTimes();
  } catch (error) {
    console.error('❌ Erro:', error);
    alert("❌ Erro ao criar agendamento.");
  }
}

// Exibir agendamentos na área administrativa (ADMIN APENAS - TODOS os agendamentos)
function showAdminSchedules() {
  const isLoggedIn = sessionStorage.getItem(ADMIN_LOGIN_KEY);
  
  if (!isLoggedIn) {
    alert("Acesso negado!");
    return;
  }
  
  const schedules = getSchedules();
  const schedulesList = document.getElementById("schedulesList");
  
  if (schedules.length === 0) {
    schedulesList.innerHTML = '<p class="no-schedules">Nenhum agendamento realizado.</p>';
    return;
  }
  
  schedulesList.innerHTML = "";
  
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
      <button class="btn" style="margin-top: 0.5rem; background: #ff6b6b;" onclick="deleteSchedule('${schedule.id}')">Remover</button>
    `;
    schedulesList.appendChild(item);
  });
}

// Remover agendamento específico
function deleteSchedule(id) {
  if (!confirm("Tem certeza que deseja remover este agendamento?")) {
    return;
  }
  
  const schedules = getSchedules();
  const filtered = schedules.filter(s => s.id !== id);
  saveSchedules(filtered);
  
  alert("✅ Agendamento deletado!");
  showAdminSchedules();
}

// Limpar toda a agenda
function clearAllSchedules() {
  if (!confirm("Tem certeza que deseja limpar TODA a agenda? Esta ação não pode ser desfeita!")) {
    return;
  }
  
  const schedules = getSchedules();
  const count = schedules.length;
  saveSchedules([]);
  
  alert(`✅ ${count} agendamentos foram deletados!`);
  showAdminSchedules();
}

// Fechar todos os modais
function closeAllModals() {
  scheduleModal.classList.remove("active");
  clientLoginModal.classList.remove("active");
  adminLoginModal.classList.remove("active");
  clientSchedulesModal.classList.remove("active");
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

// ===== Funções de Debug =====
console.log("✅ Aplicação carregada com sucesso!");
console.log("📋 Dados armazenados no localStorage");
console.log("🔐 Senha admin padrão: admin123");

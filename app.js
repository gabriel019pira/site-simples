// Configurações
const ADMIN_PASSWORD = "admin123"; // Senha do proprietário
const SCHEDULES_KEY = "schedules";
const ADMIN_LOGIN_KEY = "adminLoggedIn";
const CLIENT_LOGIN_KEY = "clientLoggedIn";
const CLIENT_PHONE_KEY = "clientPhone";

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
  // Limpar localStorage
  localStorage.clear();
  // Limpar sessionStorage
  sessionStorage.clear();
  // Recarregar página
  alert("✅ Cache limpo com sucesso! A página será recarregada.");
  location.reload();
}

// Event Listeners - Menu lateral agora é fixo

// Função para atualizar horários disponíveis
function updateAvailableTimes() {
  const selectedDate = document.getElementById("calendarInput").value;
  const timeSelect = document.getElementById("timeInput");
  const bookedTimesInfo = document.getElementById("bookedTimes");
  const availableInfo = document.getElementById("availableInfo");
  
  if (!selectedDate) {
    bookedTimesInfo.textContent = "";
    availableInfo.textContent = "";
    // Habilitar todos os horários
    Array.from(timeSelect.options).forEach(option => {
      if (option.value) {
        option.disabled = false;
      }
    });
    return;
  }
  
  // Obter todos os agendamentos
  const schedules = JSON.parse(localStorage.getItem(SCHEDULES_KEY)) || [];
  
  // Filtrar agendamentos para a data selecionada
  const bookedTimesArray = schedules
    .filter(s => s.date === selectedDate)
    .map(s => s.time);
  
  console.log(`📅 Data: ${selectedDate}`);
  console.log(`⏰ Horários agendados: ${bookedTimesArray.join(", ") || "Nenhum"}`);
  
  // Desabilitar horários já agendados
  let disabledCount = 0;
  Array.from(timeSelect.options).forEach(option => {
    if (option.value) {
      const isBooked = bookedTimesArray.includes(option.value);
      option.disabled = isBooked;
      if (isBooked) {
        option.textContent = `${option.value} (INDISPONÍVEL)`;
        disabledCount++;
      } else {
        // Restaurar texto original
        const hours = option.value;
        option.textContent = hours;
      }
    }
  });
  
  // Atualizar mensagens informativas
  const totalHours = Array.from(timeSelect.options).filter(o => o.value).length;
  const availableCount = totalHours - disabledCount;
  
  if (disabledCount > 0) {
    bookedTimesInfo.textContent = `⏳ Horários marcados: ${bookedTimesArray.join(", ")}`;
  } else {
    bookedTimesInfo.textContent = "";
  }
  
  availableInfo.textContent = `✅ ${availableCount} horários disponíveis`;
  
  // Limpar seleção anterior se estava bloqueada
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
  
  // Verificar se existe algum agendamento com esse telefone
  const schedules = JSON.parse(localStorage.getItem(SCHEDULES_KEY)) || [];
  const clientSchedules = schedules.filter(s => s.phone === phone);
  
  if (clientSchedules.length === 0) {
    alert("❌ Nenhum agendamento encontrado com este telefone.\n\nVerifique se digitou corretamente ou agende uma consulta.");
    return;
  }
  
  console.log(`✅ Cliente autenticado: ${phone}`);
  console.log(`📊 Agendamentos encontrados: ${clientSchedules.length}`);
  
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
  
  const schedules = JSON.parse(localStorage.getItem(SCHEDULES_KEY)) || [];
  const clientSchedulesList = document.getElementById("clientSchedulesList");
  
  // Filtrar agendamentos do cliente
  const mySchedules = schedules.filter(s => s.phone === clientPhone);
  
  console.log(`🔍 Buscando agendamentos para: ${clientPhone}`);
  console.log(`📊 Encontrados: ${mySchedules.length}`);
  
  if (mySchedules.length === 0) {
    clientSchedulesList.innerHTML = '<p class="no-schedules">Você não possui agendamentos.</p>';
    return;
  }
  
  clientSchedulesList.innerHTML = "";
  
  // Ordenar por data e hora
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
  
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_LOGIN_KEY, "true");
    closeAdminLoginModal();
    openAdminModal();
    showAdminSchedules();
  } else {
    alert("Senha incorreta!");
  }
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
  
  // Verificar se o horário ainda está disponível (double-check)
  const schedules = JSON.parse(localStorage.getItem(SCHEDULES_KEY)) || [];
  const isTimeBooked = schedules.some(s => s.date === date && s.time === time);
  
  if (isTimeBooked) {
    alert("⚠️ Desculpe! Este horário foi agendado neste intervalo.\n\nPor favor, escolha outro horário ou data.");
    updateAvailableTimes();
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
  schedules.push(schedule);
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
  
  // Debug
  console.log("✅ Agendamento salvo:", schedule);
  console.log("📋 Total de agendamentos:", schedules.length);
  console.log("💾 localStorage:", localStorage.getItem(SCHEDULES_KEY));
  
  // Limpar formulário
  document.getElementById("clientName").value = "";
  document.getElementById("clientEmail").value = "";
  document.getElementById("clientPhone").value = "";
  document.getElementById("calendarInput").value = "";
  document.getElementById("timeInput").value = "";
  
  closeScheduleModal();
  alert("✅ Agendamento realizado com sucesso!\n\n📅 Data: " + new Date(date).toLocaleDateString("pt-BR") + "\n⏰ Horário: " + time + "\n👤 Cliente: " + name);
}

// Exibir agendamentos na área administrativa (ADMIN APENAS - TODOS os agendamentos)
function showAdminSchedules() {
  const isLoggedIn = sessionStorage.getItem(ADMIN_LOGIN_KEY);
  
  if (!isLoggedIn) {
    alert("Acesso negado!");
    return;
  }
  
  const schedules = JSON.parse(localStorage.getItem(SCHEDULES_KEY)) || [];
  const schedulesList = document.getElementById("schedulesList");
  
  // Debug
  console.log("🔍 Admin verificando todos os agendamentos...");
  console.log("💾 localStorage content:", localStorage.getItem(SCHEDULES_KEY));
  console.log("📊 Total encontrado:", schedules.length);
  
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
// Verificar localStorage via console
function checkSchedules() {
  const data = localStorage.getItem("schedules");
  console.log("📊 AGENDAMENTOS SALVOS:");
  console.log(data ? JSON.parse(data) : "❌ Nenhum agendamento encontrado");
  return data ? JSON.parse(data) : [];
}

// Teste rápido (adiciona agendamento fake)
function testSchedule() {
  const fakeSchedule = {
    id: Date.now(),
    name: "TESTE - " + new Date().getTime(),
    email: "teste@example.com",
    phone: "(11) 99999-9999",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    createdAt: new Date().toLocaleString("pt-BR")
  };
  
  let schedules = JSON.parse(localStorage.getItem(SCHEDULES_KEY)) || [];
  schedules.push(fakeSchedule);
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
  
  console.log("✅ Agendamento de teste criado:");
  checkSchedules();
}

// Limpar dados de teste (remover tudo)
function clearData() {
  if (confirm("⚠️ Limpar TODOS os agendamentos?")) {
    localStorage.removeItem(SCHEDULES_KEY);
    console.log("🗑️ localStorage limpo");
  }
}

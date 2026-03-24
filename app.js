// ========== CONFIGURAÇÃO SUPABASE ==========
const SUPABASE_URL = "https://dpobhypdzgorabjlkppv.supabase.co";
const SUPABASE_KEY = "sb_publishable_7-rieCzisyK5_WDG5oJ91g_cG4xHvJs";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_PASSWORD = "admin123";
const SCHEDULES_KEY = "schedules";
const ADMIN_LOGIN_KEY = "adminLoggedIn";
const CLIENT_LOGIN_KEY = "clientLoggedIn";
const CLIENT_PHONE_KEY = "clientPhone";

console.log("✅ Sistema rodando com Supabase (NUVEM)");

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
  sessionStorage.clear();
  alert("✅ Sessão limpa com sucesso! A página será recarregada.");
  location.reload();
}

// ========== HORÁRIOS DISPONÍVEIS ==========
// Função para obter horários marcados em uma data
async function getBookedTimes(date) {
  try {
    const { data, error } = await db
      .from("agendamentos")
      .select("time")
      .eq("date", date);
    
    if (error) {
      console.error("Erro ao buscar horários:", error);
      return [];
    }
    
    return data.map(s => s.time).sort();
  } catch (e) {
    console.error(e);
    return [];
  }
}

// Função para atualizar horários disponíveis
async function updateAvailableTimes() {
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
  
  const bookedTimes = await getBookedTimes(selectedDate);
  let disabledCount = 0;
  
  Array.from(timeSelect.options).forEach(option => {
    if (option.value) {
      const isBooked = bookedTimes.includes(option.value);
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
    bookedTimesInfo.textContent = `⏳ Horários marcados: ${bookedTimes.join(", ")}`;
  } else {
    bookedTimesInfo.textContent = "";
  }
  
  availableInfo.textContent = `✅ ${availableCount} horários disponíveis`;
  
  if (timeSelect.value && bookedTimes.includes(timeSelect.value)) {
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
  
  // Salvar na sessão e depois buscar agendamentos
  sessionStorage.setItem("clientPhone", phone);
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
  sessionStorage.removeItem("clientPhone");
  closeClientSchedulesModal();
}

// Função para exibir agendamentos do cliente
async function showClientSchedules() {
  const clientPhone = sessionStorage.getItem("clientPhone");
  
  if (!clientPhone) {
    alert("Acesso negado!");
    return;
  }
  
  try {
    const { data, error } = await db
      .from("agendamentos")
      .select("*")
      .eq("phone", clientPhone)
      .order("date", { ascending: true });
    
    if (error) throw error;
    
    const clientSchedulesList = document.getElementById("clientSchedulesList");
    
    if (!data || data.length === 0) {
      clientSchedulesList.innerHTML = '<p class="no-schedules">Você não possui agendamentos.</p>';
      return;
    }
    
    clientSchedulesList.innerHTML = "";
    
    data.forEach(schedule => {
      const formatDate = new Date(schedule.date).toLocaleDateString("pt-BR");
      const item = document.createElement("div");
      item.className = "schedule-item";
      item.innerHTML = `
        <p><strong>Data:</strong> ${formatDate}</p>
        <p><strong>Horário:</strong> ${schedule.time}</p>
        <p><strong>Agendado em:</strong> ${new Date(schedule.created_at).toLocaleString("pt-BR")}</p>
        <p style="font-size: 0.85rem; color: #999; margin-top: 0.5rem;">Para cancelar, entre em contato conosco.</p>
      `;
      clientSchedulesList.appendChild(item);
    });
  } catch (e) {
    console.error(e);
    alert("❌ Erro ao buscar agendamentos");
  }
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
    sessionStorage.setItem("adminLoggedIn", "true");
    closeAdminLoginModal();
    openAdminModal();
    showAdminSchedules();
  } else {
    alert("❌ Senha incorreta!");
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
    // Verificar se horário já foi marcado
    const { data: existing, error: checkError } = await db
      .from("agendamentos")
      .select("id")
      .eq("date", date)
      .eq("time", time);
    
    if (checkError) throw checkError;
    
    if (existing && existing.length > 0) {
      alert("❌ Este horário já foi marcado! Escolha outro.");
      return;
    }
    
    // Inserir novo agendamento
    const { error } = await db.from("agendamentos").insert([
      {
        name,
        email,
        phone,
        date,
        time
      }
    ]);
    
    if (error) throw error;
    
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
    await updateAvailableTimes();
  } catch (error) {
    console.error("Erro:", error);
    alert("❌ Erro ao criar agendamento. Tente novamente.");
  }
}

// Exibir agendamentos na área administrativa (ADMIN APENAS - TODOS os agendamentos)
async function showAdminSchedules() {
  const isLoggedIn = sessionStorage.getItem("adminLoggedIn");
  
  if (!isLoggedIn) {
    alert("Acesso negado!");
    return;
  }
  
  try {
    const { data, error } = await db
      .from("agendamentos")
      .select("*")
      .order("date", { ascending: true });
    
    if (error) throw error;
    
    const schedulesList = document.getElementById("schedulesList");
    
    if (!data || data.length === 0) {
      schedulesList.innerHTML = '<p class="no-schedules">Nenhum agendamento realizado.</p>';
      return;
    }
    
    schedulesList.innerHTML = "";
    
    data.forEach(schedule => {
      const formatDate = new Date(schedule.date).toLocaleDateString("pt-BR");
      const item = document.createElement("div");
      item.className = "schedule-item";
      item.innerHTML = `
        <p><strong>Cliente:</strong> ${schedule.name}</p>
        <p><strong>Email:</strong> ${schedule.email}</p>
        <p><strong>Telefone:</strong> ${schedule.phone}</p>
        <p><strong>Data:</strong> ${formatDate}</p>
        <p><strong>Horário:</strong> ${schedule.time}</p>
        <p><strong>Agendado em:</strong> ${new Date(schedule.created_at).toLocaleString("pt-BR")}</p>
        <button class="btn" style="margin-top: 0.5rem; background: #ff6b6b;" onclick="deleteSchedule(${schedule.id})">Remover</button>
      `;
      schedulesList.appendChild(item);
    });
  } catch (e) {
    console.error(e);
    alert("❌ Erro ao buscar agendamentos");
  }
}

// Remover agendamento específico
async function deleteSchedule(id) {
  if (!confirm("Tem certeza que deseja remover este agendamento?")) {
    return;
  }
  
  try {
    const { error } = await db
      .from("agendamentos")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    alert("✅ Agendamento deletado!");
    await showAdminSchedules();
  } catch (e) {
    console.error(e);
    alert("❌ Erro ao deletar agendamento");
  }
}

// Limpar toda a agenda
async function clearAllSchedules() {
  if (!confirm("Tem certeza que deseja limpar TODA a agenda? Esta ação não pode ser desfeita!")) {
    return;
  }
  
  try {
    const { data: allSchedules, error: fetchError } = await db
      .from("agendamentos")
      .select("id");
    
    if (fetchError) throw fetchError;
    
    const deletedCount = allSchedules ? allSchedules.length : 0;
    
    if (deletedCount > 0) {
      const { error } = await db
        .from("agendamentos")
        .delete()
        .gt("id", 0); // Deleta todos
      
      if (error) throw error;
    }
    
    alert(`✅ ${deletedCount} agendamentos foram deletados!`);
    await showAdminSchedules();
  } catch (e) {
    console.error(e);
    alert("❌ Erro ao limpar agendamentos");
  }
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
console.log("📋 Modo: localStorage (LOCAL)");
console.log("🔐 Senha admin: admin123");

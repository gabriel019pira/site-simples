// ========== CONFIGURAÇÃO SUPABASE ==========
let db;

const ADMIN_PASSWORD = "admin123";

// DOM Elements
let sidebar, sidebarToggle, scheduleModal, clientLoginModal, adminLoginModal, clientSchedulesModal, adminModal, modalOverlay;

// Aguardar Supabase carregar
function initSupabase() {
  if (typeof supabase === 'undefined') {
    console.error("❌ Supabase não carregou ainda!");
    setTimeout(initSupabase, 300);
    return;
  }
  
  const SUPABASE_URL = "https://dpobhypdzgorabjlkppv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_7-rieCzisyK5_WDG5oJ91g_cG4xHvJs";
  db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("✅ Supabase inicializado!");
}

function initDOM() {
  sidebar = document.getElementById("sidebar");
  sidebarToggle = document.getElementById("sidebarToggle");
  scheduleModal = document.getElementById("scheduleModal");
  clientLoginModal = document.getElementById("clientLoginModal");
  adminLoginModal = document.getElementById("adminLoginModal");
  clientSchedulesModal = document.getElementById("clientSchedulesModal");
  adminModal = document.getElementById("adminModal");
  modalOverlay = document.getElementById("modalOverlay");
  
  console.log("✅ DOM inicializado!");
  console.log("✅ Sistema pronto!");
  
  // Event Listeners
  if (modalOverlay) {
    modalOverlay.addEventListener("click", closeAllModals);
  }
  
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals();
    }
  });
  
  document.querySelectorAll(".modal-content").forEach(modal => {
    modal.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  });
}

// Aguardar DOM e Supabase
window.addEventListener("load", () => {
  initSupabase();
  initDOM();
});

// ========== SIDEBAR ==========
function toggleSidebar() {
  if (sidebar) {
    sidebar.classList.toggle("collapsed");
    document.querySelector("main").classList.toggle("sidebar-collapsed");
    document.querySelector(".footer").classList.toggle("sidebar-collapsed");
    document.querySelector(".topbar").classList.toggle("sidebar-collapsed");
  }
}

function clearCache() {
  sessionStorage.clear();
  alert("✅ Sessão limpa com sucesso! A página será recarregada.");
  location.reload();
}

// ========== HORÁRIOS DISPONÍVEIS ==========
async function getBookedTimes(date) {
  try {
    if (!db) return [];
    const { data, error } = await db
      .from("agendamentos")
      .select("time")
      .eq("date", date);
    
    if (error) {
      console.error("Erro ao buscar horários:", error);
      return [];
    }
    
    return data ? data.map(s => s.time).sort() : [];
  } catch (e) {
    console.error("Erro em getBookedTimes:", e);
    return [];
  }
}

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

// ========== MODAIS DE AGENDAMENTO ==========
function openScheduleModal() {
  if (!scheduleModal || !modalOverlay) {
    console.error("Modal não encontrada");
    return;
  }
  scheduleModal.classList.add("active");
  modalOverlay.classList.add("active");
  
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("calendarInput").min = today;
  document.getElementById("calendarInput").value = today;
  
  setTimeout(() => {
    updateAvailableTimes();
  }, 100);
}

function closeScheduleModal() {
  if (scheduleModal && modalOverlay) {
    scheduleModal.classList.remove("active");
    modalOverlay.classList.remove("active");
  }
}

// ========== MODAIS LOGIN CLIENTE ==========
function openClientLoginModal() {
  if (!clientLoginModal || !modalOverlay) {
    console.error("Modal login cliente não encontrada");
    return;
  }
  clientLoginModal.classList.add("active");
  modalOverlay.classList.add("active");
  document.getElementById("clientPhoneLogin").value = "";
}

function closeClientLoginModal() {
  if (clientLoginModal && modalOverlay) {
    clientLoginModal.classList.remove("active");
    modalOverlay.classList.remove("active");
  }
}

function validateClientLogin() {
  const phone = document.getElementById("clientPhoneLogin").value.trim();
  
  if (!phone) {
    alert("Por favor, digite seu telefone!");
    return;
  }
  
  sessionStorage.setItem("clientPhone", phone);
  closeClientLoginModal();
  setTimeout(() => {
    openClientSchedulesModal();
    showClientSchedules();
  }, 200);
}

// ========== MODAIS VISUALIZAÇÃO CLIENTE ==========
function openClientSchedulesModal() {
  if (!clientSchedulesModal || !modalOverlay) {
    console.error("Modal agendamentos cliente não encontrada");
    return;
  }
  clientSchedulesModal.classList.add("active");
  modalOverlay.classList.add("active");
}

function closeClientSchedulesModal() {
  if (clientSchedulesModal && modalOverlay) {
    clientSchedulesModal.classList.remove("active");
    modalOverlay.classList.remove("active");
  }
}

function logoutClient() {
  sessionStorage.removeItem("clientPhone");
  closeClientSchedulesModal();
}

async function showClientSchedules() {
  const clientPhone = sessionStorage.getItem("clientPhone");
  
  if (!clientPhone || !db) {
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
    console.error("Erro em showClientSchedules:", e);
    alert("❌ Erro ao buscar agendamentos");
  }
}

// ========== MODAIS LOGIN ADMIN ==========
function openAdminLoginModal() {
  if (!adminLoginModal || !modalOverlay) {
    console.error("Modal login admin não encontrada");
    return;
  }
  adminLoginModal.classList.add("active");
  modalOverlay.classList.add("active");
  document.getElementById("adminPassword").value = "";
}

function closeAdminLoginModal() {
  if (adminLoginModal && modalOverlay) {
    adminLoginModal.classList.remove("active");
    modalOverlay.classList.remove("active");
  }
}

function validateAdminLogin() {
  const password = document.getElementById("adminPassword").value;
  
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem("adminLoggedIn", "true");
    closeAdminLoginModal();
    setTimeout(() => {
      openAdminModal();
      showAdminSchedules();
    }, 200);
  } else {
    alert("❌ Senha incorreta!");
  }
}

// ========== MODAIS ADMIN ==========
function openAdminModal() {
  if (!adminModal || !modalOverlay) {
    console.error("Modal admin não encontrada");
    return;
  }
  adminModal.classList.add("active");
  modalOverlay.classList.add("active");
}

function closeAdminModal() {
  if (adminModal && modalOverlay) {
    adminModal.classList.remove("active");
    modalOverlay.classList.remove("active");
  }
}

function logoutAdmin() {
  sessionStorage.removeItem("adminLoggedIn");
  closeAdminModal();
}

async function showAdminSchedules() {
  if (!sessionStorage.getItem("adminLoggedIn") || !db) {
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
    console.error("Erro em showAdminSchedules:", e);
    alert("❌ Erro ao buscar agendamentos");
  }
}

// ========== AGENDAMENTO ==========
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
  
  if (!db) {
    alert("Erro: Banco de dados não conectado. Tente novamente.");
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Por favor, insira um email válido!");
    return;
  }
  
  try {
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
    
    const { error } = await db.from("agendamentos").insert([
      { name, email, phone, date, time }
    ]);
    
    if (error) throw error;
    
    document.getElementById("clientName").value = "";
    document.getElementById("clientEmail").value = "";
    document.getElementById("clientPhone").value = "";
    document.getElementById("calendarInput").value = "";
    document.getElementById("timeInput").value = "";
    
    closeScheduleModal();
    const formatDate = new Date(date).toLocaleDateString("pt-BR");
    alert(`✅ Agendamento realizado com sucesso!\n\n📅 Data: ${formatDate}\n⏰ Horário: ${time}\n👤 Cliente: ${name}`);
    
    await updateAvailableTimes();
  } catch (error) {
    console.error("Erro em confirmSchedule:", error);
    alert("❌ Erro ao criar agendamento. Tente novamente.");
  }
}

// ========== DELETAR AGENDAMENTOS ==========
async function deleteSchedule(id) {
  if (!confirm("Tem certeza que deseja remover este agendamento?")) {
    return;
  }
  
  if (!db) {
    alert("Erro: Banco de dados não conectado.");
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
    console.error("Erro em deleteSchedule:", e);
    alert("❌ Erro ao deletar agendamento");
  }
}

async function clearAllSchedules() {
  if (!confirm("Tem certeza que deseja limpar TODA a agenda? Esta ação não pode ser desfeita!")) {
    return;
  }
  
  if (!db) {
    alert("Erro: Banco de dados não conectado.");
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
        .gt("id", 0);
      
      if (error) throw error;
    }
    
    alert(`✅ ${deletedCount} agendamentos foram deletados!`);
    await showAdminSchedules();
  } catch (e) {
    console.error("Erro em clearAllSchedules:", e);
    alert("❌ Erro ao limpar agendamentos");
  }
}

// ========== FECHAR MODAIS ==========
function closeAllModals() {
  if (scheduleModal) scheduleModal.classList.remove("active");
  if (clientLoginModal) clientLoginModal.classList.remove("active");
  if (adminLoginModal) adminLoginModal.classList.remove("active");
  if (clientSchedulesModal) clientSchedulesModal.classList.remove("active");
  if (adminModal) adminModal.classList.remove("active");
  if (modalOverlay) modalOverlay.classList.remove("active");
  if (sidebar) sidebar.classList.remove("collapsed");
  document.querySelector("main")?.classList.remove("sidebar-collapsed");
  document.querySelector(".footer")?.classList.remove("sidebar-collapsed");
  document.querySelector(".topbar")?.classList.remove("sidebar-collapsed");
}

console.log("✅ App.js carregado com sucesso!");

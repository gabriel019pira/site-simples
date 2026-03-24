// ========== VARIÁVEIS GLOBAIS ==========
let db = null;
const ADMIN_PASSWORD = "admin123";

// Inicializar Supabase de forma assíncrona
(async function initSupabaseAsync() {
  if (typeof supabase === 'undefined') {
    await new Promise(resolve => {
      const checkSupabase = setInterval(() => {
        if (typeof supabase !== 'undefined') {
          clearInterval(checkSupabase);
          resolve();
        }
      }, 100);
      setTimeout(() => clearInterval(checkSupabase), 5000);
    });
  }
  
  try {
    const SUPABASE_URL = "https://dpobhypdzgorabjlkppv.supabase.co";
    const SUPABASE_KEY = "sb_publishable_7-rieCzisyK5_WDG5oJ91g_cG4xHvJs";
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("✅ Supabase inicializado!");
  } catch (e) {
    console.error("❌ Erro ao inicializar Supabase:", e);
  }
})();

// ========== FUNÇÕES AUXILIARES ==========
function getElement(id) {
  return document.getElementById(id);
}

function toggleSidebar() {
  const sidebar = getElement("sidebar");
  if (!sidebar) return;
  sidebar.classList.toggle("collapsed");
  document.querySelector("main")?.classList.toggle("sidebar-collapsed");
  document.querySelector(".footer")?.classList.toggle("sidebar-collapsed");
  document.querySelector(".topbar")?.classList.toggle("sidebar-collapsed");
}

function clearCache() {
  sessionStorage.clear();
  alert("✅ Sessão limpa com sucesso! A página será recarregada.");
  location.reload();
}

function closeAllModals() {
  const modals = [
    "scheduleModal",
    "clientLoginModal", 
    "adminLoginModal",
    "clientSchedulesModal",
    "adminModal"
  ];
  
  modals.forEach(id => {
    const modal = getElement(id);
    if (modal) modal.classList.remove("active");
  });
  
  const overlay = getElement("modalOverlay");
  if (overlay) overlay.classList.remove("active");
  
  const sidebar = getElement("sidebar");
  if (sidebar) sidebar.classList.remove("collapsed");
}

// ========== MODAIS ==========
function openScheduleModal() {
  const modal = getElement("scheduleModal");
  const overlay = getElement("modalOverlay");
  if (!modal || !overlay) return;
  
  modal.classList.add("active");
  overlay.classList.add("active");
  
  const today = new Date().toISOString().split("T")[0];
  const cal = getElement("calendarInput");
  if (cal) {
    cal.min = today;
    cal.value = today;
    updateAvailableTimes();
  }
}

function closeScheduleModal() {
  const modal = getElement("scheduleModal");
  const overlay = getElement("modalOverlay");
  if (modal) modal.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
}

function openClientLoginModal() {
  const modal = getElement("clientLoginModal");
  const overlay = getElement("modalOverlay");
  if (!modal || !overlay) return;
  
  modal.classList.add("active");
  overlay.classList.add("active");
  
  const phone = getElement("clientPhoneLogin");
  if (phone) phone.value = "";
}

function closeClientLoginModal() {
  const modal = getElement("clientLoginModal");
  const overlay = getElement("modalOverlay");
  if (modal) modal.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
}

function openClientSchedulesModal() {
  const modal = getElement("clientSchedulesModal");
  const overlay = getElement("modalOverlay");
  if (!modal || !overlay) return;
  
  modal.classList.add("active");
  overlay.classList.add("active");
}

function closeClientSchedulesModal() {
  const modal = getElement("clientSchedulesModal");
  const overlay = getElement("modalOverlay");
  if (modal) modal.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
}

function openAdminLoginModal() {
  const modal = getElement("adminLoginModal");
  const overlay = getElement("modalOverlay");
  if (!modal || !overlay) return;
  
  modal.classList.add("active");
  overlay.classList.add("active");
  
  const pass = getElement("adminPassword");
  if (pass) pass.value = "";
}

function closeAdminLoginModal() {
  const modal = getElement("adminLoginModal");
  const overlay = getElement("modalOverlay");
  if (modal) modal.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
}

function openAdminModal() {
  const modal = getElement("adminModal");
  const overlay = getElement("modalOverlay");
  if (!modal || !overlay) return;
  
  modal.classList.add("active");
  overlay.classList.add("active");
}

function closeAdminModal() {
  const modal = getElement("adminModal");
  const overlay = getElement("modalOverlay");
  if (modal) modal.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
}

// ========== HORÁRIOS ==========
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
  const cal = getElement("calendarInput");
  const timeSelect = getElement("timeInput");
  const bookedInfo = getElement("bookedTimes");
  const availInfo = getElement("availableInfo");
  
  if (!cal || !timeSelect) return;
  
  const date = cal.value;
  if (!date) {
    if (bookedInfo) bookedInfo.textContent = "";
    if (availInfo) availInfo.textContent = "";
    Array.from(timeSelect.options).forEach(opt => {
      if (opt.value) opt.disabled = false;
    });
    return;
  }
  
  const booked = await getBookedTimes(date);
  let disabledCount = 0;
  
  Array.from(timeSelect.options).forEach(opt => {
    if (opt.value) {
      const isBooked = booked.includes(opt.value);
      opt.disabled = isBooked;
      opt.textContent = isBooked ? `${opt.value} (INDISPONÍVEL)` : opt.value;
      if (isBooked) disabledCount++;
    }
  });
  
  const total = Array.from(timeSelect.options).filter(o => o.value).length;
  const available = total - disabledCount;
  
  if (bookedInfo) {
    bookedInfo.textContent = disabledCount > 0 ? `⏳ Horários marcados: ${booked.join(", ")}` : "";
  }
  if (availInfo) {
    availInfo.textContent = `✅ ${available} horários disponíveis`;
  }
  
  if (timeSelect.value && booked.includes(timeSelect.value)) {
    timeSelect.value = "";
  }
}

// ========== AUTENTICAÇÃO CLIENTE ==========
function validateClientLogin() {
  const phoneInput = getElement("clientPhoneLogin");
  if (!phoneInput) return;
  
  const phone = phoneInput.value.trim();
  if (!phone) {
    alert("Por favor, digite seu telefone!");
    return;
  }
  
  sessionStorage.setItem("clientPhone", phone);
  closeClientLoginModal();
  
  setTimeout(() => {
    openClientSchedulesModal();
    showClientSchedules();
  }, 100);
}

function logoutClient() {
  sessionStorage.removeItem("clientPhone");
  closeClientSchedulesModal();
}

async function showClientSchedules() {
  const phone = sessionStorage.getItem("clientPhone");
  if (!phone || !db) {
    alert("Acesso negado!");
    return;
  }
  
  try {
    const { data, error } = await db
      .from("agendamentos")
      .select("*")
      .eq("phone", phone)
      .order("date", { ascending: true });
    
    if (error) throw error;
    
    const list = getElement("clientSchedulesList");
    if (!list) return;
    
    if (!data || data.length === 0) {
      list.innerHTML = '<p class="no-schedules">Você não possui agendamentos.</p>';
      return;
    }
    
    list.innerHTML = "";
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
      list.appendChild(item);
    });
  } catch (e) {
    console.error("Erro em showClientSchedules:", e);
    alert("❌ Erro ao buscar agendamentos");
  }
}

// ========== AUTENTICAÇÃO ADMIN ==========
function validateAdminLogin() {
  const passInput = getElement("adminPassword");
  if (!passInput) return;
  
  const password = passInput.value;
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem("adminLoggedIn", "true");
    closeAdminLoginModal();
    
    setTimeout(() => {
      openAdminModal();
      showAdminSchedules();
    }, 100);
  } else {
    alert("❌ Senha incorreta!");
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
    
    const list = getElement("schedulesList");
    if (!list) return;
    
    if (!data || data.length === 0) {
      list.innerHTML = '<p class="no-schedules">Nenhum agendamento realizado.</p>';
      return;
    }
    
    list.innerHTML = "";
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
      list.appendChild(item);
    });
  } catch (e) {
    console.error("Erro em showAdminSchedules:", e);
    alert("❌ Erro ao buscar agendamentos");
  }
}

// ========== AGENDAMENTO ==========
async function confirmSchedule() {
  const nameInput = getElement("clientName");
  const emailInput = getElement("clientEmail");
  const phoneInput = getElement("clientPhone");
  const calInput = getElement("calendarInput");
  const timeInput = getElement("timeInput");
  
  if (!nameInput || !emailInput || !phoneInput || !calInput || !timeInput) return;
  
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const date = calInput.value;
  const time = timeInput.value;
  
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
    
    nameInput.value = "";
    emailInput.value = "";
    phoneInput.value = "";
    calInput.value = "";
    timeInput.value = "";
    
    closeScheduleModal();
    const formatDate = new Date(date).toLocaleDateString("pt-BR");
    alert(`✅ Agendamento realizado com sucesso!\n\n📅 Data: ${formatDate}\n⏰ Horário: ${time}\n👤 Cliente: ${name}`);
    
  } catch (error) {
    console.error("Erro em confirmSchedule:", error);
    alert("❌ Erro ao criar agendamento. Tente novamente.");
  }
}

// ========== GERENCIAR AGENDAMENTOS ==========
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
    
    const count = allSchedules ? allSchedules.length : 0;
    
    if (count > 0) {
      const { error } = await db
        .from("agendamentos")
        .delete()
        .gt("id", 0);
      
      if (error) throw error;
    }
    
    alert(`✅ ${count} agendamentos foram deletados!`);
    await showAdminSchedules();
  } catch (e) {
    console.error("Erro em clearAllSchedules:", e);
    alert("❌ Erro ao limpar agendamentos");
  }
}

// ========== EVENT LISTENERS ==========
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function() {
    const overlay = getElement("modalOverlay");
    if (overlay) {
      overlay.addEventListener("click", closeAllModals);
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
  });
} else {
  const overlay = getElement("modalOverlay");
  if (overlay) {
    overlay.addEventListener("click", closeAllModals);
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

console.log("✅ App.js carregado!");

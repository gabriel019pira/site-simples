// ========== CONFIGURAÇÃO DE API ==========
// Detectar se está em localhost ou GitHub Pages
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : 'https://api-agendamentos.onrender.com'; // Será deploy do backend

const ADMIN_PASSWORD = "admin123";
const SCHEDULES_KEY = "schedules";
const ADMIN_LOGIN_KEY = "adminLoggedIn";
const CLIENT_LOGIN_KEY = "clientLoggedIn";
const CLIENT_PHONE_KEY = "clientPhone";

console.log(`🔧 API URL: ${API_URL}`);

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
    Array.from(timeSelect.options).forEach(option => {
      if (option.value) option.disabled = false;
    });
    return;
  }
  
  // Buscar agendamentos do backend para a data
  fetch(`${API_URL}/api/agendamentos/cliente/temp`)
    .then(r => r.json())
    .then(schedules => {
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
    })
    .catch(e => {
      console.error("Erro ao atualizar horários:", e);
    });
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
  
  fetch(`${API_URL}/api/login/cliente`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  })
    .then(r => r.json())
    .then(data => {
      if (data.autenticado) {
        sessionStorage.setItem(CLIENT_LOGIN_KEY, "true");
        sessionStorage.setItem(CLIENT_PHONE_KEY, phone);
        closeClientLoginModal();
        openClientSchedulesModal();
        showClientSchedules();
      } else {
        alert(data.erro || "❌ Nenhum agendamento encontrado");
      }
    })
    .catch(e => {
      console.error(e);
      alert("❌ Erro ao conectar com o servidor");
    });
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
  
  fetch(`${API_URL}/api/agendamentos/cliente/${clientPhone}`, {
    method: 'GET'
  })
    .then(r => r.json())
    .then(mySchedules => {
      const clientSchedulesList = document.getElementById("clientSchedulesList");
      
      if (!Array.isArray(mySchedules) || mySchedules.length === 0) {
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
    })
    .catch(e => {
      console.error(e);
      alert("❌ Erro ao buscar agendamentos");
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
  
  fetch(`${API_URL}/api/login/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
    .then(r => r.json())
    .then(data => {
      if (data.autenticado) {
        sessionStorage.setItem(ADMIN_LOGIN_KEY, "true");
        closeAdminLoginModal();
        openAdminModal();
        showAdminSchedules();
      } else {
        alert("❌ Senha incorreta!");
      }
    })
    .catch(e => {
      console.error(e);
      alert("❌ Erro ao conectar com o servidor");
    });
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
    const response = await fetch(`${API_URL}/api/agendamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, date, time })
    });
    
    const data = await response.json();
    
    if (response.ok) {
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
    } else {
      alert(`❌ Erro: ${data.erro}`);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    alert("❌ Erro ao criar agendamento. Verifique se o backend está rodando.");
  }
}

// Exibir agendamentos na área administrativa (ADMIN APENAS - TODOS os agendamentos)
function showAdminSchedules() {
  const isLoggedIn = sessionStorage.getItem(ADMIN_LOGIN_KEY);
  
  if (!isLoggedIn) {
    alert("Acesso negado!");
    return;
  }
  
  fetch(`${API_URL}/api/agendamentos`, {
    method: 'GET',
    headers: {
      'Authorization': ADMIN_PASSWORD
    }
  })
    .then(r => r.json())
    .then(schedules => {
      const schedulesList = document.getElementById("schedulesList");
      
      if (!Array.isArray(schedules) || schedules.length === 0) {
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
    })
    .catch(e => {
      console.error(e);
      alert("❌ Erro ao buscar agendamentos");
    });
}

// Remover agendamento específico
function deleteSchedule(id) {
  if (!confirm("Tem certeza que deseja remover este agendamento?")) {
    return;
  }
  
  fetch(`${API_URL}/api/agendamentos/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': ADMIN_PASSWORD
    }
  })
    .then(r => r.json())
    .then(data => {
      alert("✅ Agendamento deletado!");
      showAdminSchedules();
    })
    .catch(e => {
      console.error(e);
      alert("❌ Erro ao deletar agendamento");
    });
}

// Limpar toda a agenda
function clearAllSchedules() {
  if (!confirm("Tem certeza que deseja limpar TODA a agenda? Esta ação não pode ser desfeita!")) {
    return;
  }
  
  fetch(`${API_URL}/api/agendamentos`, {
    method: 'DELETE',
    headers: {
      'Authorization': ADMIN_PASSWORD
    }
  })
    .then(r => r.json())
    .then(data => {
      alert(`✅ ${data.deletados} agendamentos foram deletados!`);
      showAdminSchedules();
    })
    .catch(e => {
      console.error(e);
      alert("❌ Erro ao limpar agendamentos");
    });
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
// Verificar agendamentos via API
function checkSchedules() {
  console.log("🔍 Verificando agendamentos no backend...");
  fetch(`${API_URL}/api/agendamentos`, {
    headers: { 'Authorization': ADMIN_PASSWORD }
  })
    .then(r => r.json())
    .then(data => console.log("📊 Agendamentos:", data))
    .catch(e => console.error("❌ Erro:", e));
}
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

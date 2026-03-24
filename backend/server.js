const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());

// ========== BANCO DE DADOS ==========
let db;
let schedules = []; // Em memória

// Inicializar banco de dados
function initDatabase() {
  if (DB_TYPE === 'memory') {
    // Usar array em memória
    console.log('📦 Usando armazenamento em MEMÓRIA');
    schedules = [];
  } else {
    // Usar SQLite
    console.log('📦 Usando SQLite database');
    db = new Database('agendamentos.db');
    
    // Criar tabela se não existir
    db.exec(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        UNIQUE(date, time)
      )
    `);
    
    // Carregar dados existentes
    const rows = db.prepare('SELECT * FROM agendamentos').all();
    schedules = rows || [];
  }
}

// Gerar ID único
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Salvar dados (em banco ou no array)
function saveSchedule(schedule) {
  if (DB_TYPE === 'memory') {
    schedules.push(schedule);
  } else {
    const stmt = db.prepare(`
      INSERT INTO agendamentos (id, name, email, phone, date, time, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(schedule.id, schedule.name, schedule.email, schedule.phone, schedule.date, schedule.time, schedule.createdAt);
  }
  return schedule;
}

// Obter todos os agendamentos
function getAllSchedules() {
  if (DB_TYPE === 'memory') {
    return schedules;
  } else {
    return db.prepare('SELECT * FROM agendamentos').all();
  }
}

// Obter agendamentos de um cliente
function getClientSchedules(phone) {
  if (DB_TYPE === 'memory') {
    return schedules.filter(s => s.phone === phone);
  } else {
    return db.prepare('SELECT * FROM agendamentos WHERE phone = ?').all(phone);
  }
}

// Deletar agendamento
function deleteScheduleById(id) {
  if (DB_TYPE === 'memory') {
    const index = schedules.findIndex(s => s.id === id);
    if (index > -1) {
      schedules.splice(index, 1);
      return true;
    }
    return false;
  } else {
    const result = db.prepare('DELETE FROM agendamentos WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

// Limpar todos os agendamentos
function clearAllSchedules() {
  if (DB_TYPE === 'memory') {
    const count = schedules.length;
    schedules = [];
    return count;
  } else {
    const result = db.prepare('DELETE FROM agendamentos').run();
    return result.changes;
  }
}

// Verificar se horário está disponível
function isTimeAvailable(date, time) {
  const allSchedules = getAllSchedules();
  return !allSchedules.some(s => s.date === date && s.time === time);
}

// ========== ROTAS ==========

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toLocaleString('pt-BR') });
});

// ========== AGENDAMENTOS ==========

// GET - Listar todos os agendamentos (ADMIN)
app.get('/api/agendamentos', (req, res) => {
  const password = req.headers.authorization;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ erro: 'Não autorizado' });
  }
  
  const schedules = getAllSchedules();
  res.json(schedules);
});

// POST - Criar novo agendamento
app.post('/api/agendamentos', (req, res) => {
  const { name, email, phone, date, time } = req.body;
  
  // Validações
  if (!name || !email || !phone || !date || !time) {
    return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ erro: 'Email inválido' });
  }
  
  // Verificar se horário está disponível
  if (!isTimeAvailable(date, time)) {
    return res.status(409).json({ erro: 'Horário não está disponível' });
  }
  
  try {
    const newSchedule = {
      id: generateId(),
      name,
      email,
      phone,
      date,
      time,
      createdAt: new Date().toLocaleString('pt-BR')
    };
    
    saveSchedule(newSchedule);
    res.status(201).json(newSchedule);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ erro: 'Erro ao criar agendamento' });
  }
});

// GET - Agendamentos de um cliente
app.get('/api/agendamentos/cliente/:phone', (req, res) => {
  const { phone } = req.params;
  
  try {
    const clientSchedules = getClientSchedules(phone);
    
    if (clientSchedules.length === 0) {
      return res.status(404).json({ erro: 'Nenhum agendamento encontrado' });
    }
    
    res.json(clientSchedules);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ erro: 'Erro ao buscar agendamentos' });
  }
});

// GET - Horários disponíveis para uma data
app.get('/api/agendamentos/disponibilidade/:date', (req, res) => {
  const { date } = req.params;
  
  try {
    const allSchedules = getAllSchedules();
    const bookedTimes = allSchedules
      .filter(s => s.date === date)
      .map(s => s.time);
    
    res.json({
      date,
      bookedTimes,
      availableCount: 16 - bookedTimes.length // 16 horários totais
    });
  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error);
    res.status(500).json({ erro: 'Erro ao buscar disponibilidade' });
  }
});

// DELETE - Deletar agendamento específico
app.delete('/api/agendamentos/:id', (req, res) => {
  const password = req.headers.authorization;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ erro: 'Não autorizado' });
  }
  
  const { id } = req.params;
  
  try {
    const deleted = deleteScheduleById(id);
    
    if (!deleted) {
      return res.status(404).json({ erro: 'Agendamento não encontrado' });
    }
    
    res.json({ sucesso: true, mensagem: 'Agendamento deletado' });
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    res.status(500).json({ erro: 'Erro ao deletar agendamento' });
  }
});

// DELETE - Limpar todos os agendamentos
app.delete('/api/agendamentos', (req, res) => {
  const password = req.headers.authorization;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ erro: 'Não autorizado' });
  }
  
  try {
    const count = clearAllSchedules();
    res.json({ sucesso: true, deletados: count });
  } catch (error) {
    console.error('Erro ao limpar agendamentos:', error);
    res.status(500).json({ erro: 'Erro ao limpar agendamentos' });
  }
});

// ========== AUTENTICAÇÃO ==========

// POST - Login Cliente
app.post('/api/login/cliente', (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ erro: 'Telefone obrigatório' });
  }
  
  try {
    const clientSchedules = getClientSchedules(phone);
    
    if (clientSchedules.length === 0) {
      return res.status(404).json({ autenticado: false, erro: 'Nenhum agendamento encontrado' });
    }
    
    res.json({ autenticado: true, agendamentos: clientSchedules });
  } catch (error) {
    console.error('Erro ao fazer login cliente:', error);
    res.status(500).json({ erro: 'Erro no servidor' });
  }
});

// POST - Login Admin
app.post('/api/login/admin', (req, res) => {
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    res.json({ autenticado: true });
  } else {
    res.status(401).json({ autenticado: false, erro: 'Senha incorreta' });
  }
});

// ========== INICIAR SERVIDOR ==========
initDatabase();

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║                                        ║
║  🚀 Servidor rodando na porta ${PORT}     ║
║                                        ║
║  📋 API: http://localhost:${PORT}        ║
║  🏥 Health: http://localhost:${PORT}/health  ║
║                                        ║
║  📦 Banco de dados: ${DB_TYPE}          ║
║  🔐 Senha admin: ${ADMIN_PASSWORD}       ║
║                                        ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n✋ Encerrando servidor...');
  if (db) {
    db.close();
  }
  process.exit(0);
});

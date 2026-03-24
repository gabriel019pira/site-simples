# Backend - Site Simples Agendamentos

Backend Node.js + Express para gerenciar agendamentos de psicóloga.

## 🚀 Instalação Local

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Passos

1. **Instale as dependências:**
```bash
npm install
```

2. **Crie um arquivo `.env`:**
```bash
cp .env.example .env
```

3. **Inicie o servidor:**
```bash
npm start
```

O servidor estará disponível em: `http://localhost:3001`

## 🧪 Desenvolvimento

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

## 📝 Variáveis de Ambiente

```
PORT=3001                    # Porta do servidor
NODE_ENV=development         # Ambiente (development/production)
ADMIN_PASSWORD=admin123      # Senha do administrador
DB_TYPE=sqlite              # Tipo de banco (sqlite ou memory)
```

## 🗄️ Banco de Dados

### SQLite (Padrão)
- Arquivo: `agendamentos.db`
- Dados persistem entre reinicializações
- Recomendado para produção

### Em Memória
Para usar banco em memória, mude em `.env`:
```
DB_TYPE=memory
```
- Dados são perdidos ao reiniciar
- Útil para testes

## 📡 Endpoints da API

### Health Check
```
GET /health
```

### Agendamentos (Público)

**Criar agendamento:**
```
POST /api/agendamentos
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "(19) 99750-5260",
  "date": "2026-03-25",
  "time": "14:00"
}
```

**Listar agendamentos do cliente:**
```
GET /api/agendamentos/cliente/:phone
```

**Verificar disponibilidade:**
```
GET /api/agendamentos/disponibilidade/:date
```

### Agendamentos (Admin)

**Listar todos os agendamentos:**
```
GET /api/agendamentos
Headers: Authorization: admin123
```

**Deletar agendamento específico:**
```
DELETE /api/agendamentos/:id
Headers: Authorization: admin123
```

**Limpar todos os agendamentos:**
```
DELETE /api/agendamentos
Headers: Authorization: admin123
```

### Autenticação

**Login Cliente:**
```
POST /api/login/cliente
Content-Type: application/json

{
  "phone": "(19) 99750-5260"
}
```

**Login Admin:**
```
POST /api/login/admin
Content-Type: application/json

{
  "password": "admin123"
}
```

## 🌐 Deploy no Render

### Passo 1: Preparar repositório Git
```bash
git add .
git commit -m "Add backend Node.js"
git push origin master
```

### Passo 2: Criar aplicação no Render

1. Acesse https://render.com
2. Clique em **New +** → **Web Service**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name:** `site-simples-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
   - **Region:** Escolha próximo à sua localização

### Passo 3: Adicionar variáveis de ambiente

Em **Environment**, adicione:
```
PORT=3001
ADMIN_PASSWORD=admin123
DB_TYPE=sqlite
NODE_ENV=production
```

### Passo 4: Deploy

Clique em **Create Web Service** e aguarde o deploy.

Sua URL será: `https://site-simples-backend.onrender.com` (ou similar)

## ✅ Testar após Deploy

```bash
curl https://site-simples-backend.onrender.com/health
```

## 📝 Notas Importantes

- **Render com plano Free:** Aplicação pode ficar "adormecida" após 15 min sem uso
- **Atualize a URL no frontend** (`app.js`) com o URL do seu backend
- **Dados com SQLite:** Persistem enquanto a aplicação está rodando
- **Backup:** Faça backup do arquivo `agendamentos.db` regularmente

## 🐛 Troubleshooting

**Erro: "Cannot find module 'better-sqlite3'"**
- Execute: `npm install --build-from-source`

**Erro de PORT: "Port already in use"**
- Mude a PORT em `.env` para outra (ex: 3002)

**Banco de dados corrompido**
- Delete `agendamentos.db*` e reinicie

## 📧 Suporte

Para problemas, verifique os logs e os endpoints disponíveis com `/health`

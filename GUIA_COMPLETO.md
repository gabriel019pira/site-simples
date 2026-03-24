# 🚀 Guia Completo - Backend + Frontend Sincronizado

Seu site agora tem um **backend completo** que sincroniza dados entre todos os usuários!

## 📋 O que foi criado

```
site-simples/
├── frontend/
│   ├── index.html          ✅ Site principal
│   ├── app.js              ✅ JavaScript (ATUALIZADO para usar API)
│   ├── main.css            ✅ Estilos
│   ├── foto-perfil.jpg     ✅ Imagem de perfil
│   └── foto-fundo.jpg      ✅ Imagem de fundo
│
└── backend/
    ├── server.js           ✅ Servidor Express
    ├── package.json        ✅ Dependências
    ├── .env.example        ✅ Variáveis de ambiente
    ├── .gitignore          ✅ Arquivos ignorados
    └── README.md           ✅ Documentação backend
```

## 🧪 Testar Localmente

### 1. Instalar Backend

```bash
cd backend
npm install
```

### 2. Criar arquivo .env

```bash
cp .env.example .env
```

Arquivo `.env` padrão:
```
PORT=3001
NODE_ENV=development
ADMIN_PASSWORD=admin123
DB_TYPE=sqlite
```

### 3. Iniciar o Backend

```bash
npm start
```

Você verá:
```
╔════════════════════════════════════════╗
║                                        ║
║  🚀 Servidor rodando na porta 3001     ║
║                                        ║
║  📋 API: http://localhost:3001         ║
║  🏥 Health: http://localhost:3001/health  ║
║                                        ║
║  📦 Banco de dados: sqlite             ║
║  🔐 Senha admin: admin123              ║
║                                        ║
╚════════════════════════════════════════╝
```

### 4. Abrir o Frontend

- Abra `index.html` no navegador
- O JavaScript automaticamente detectarará que está em `localhost` e se conectará a `http://localhost:3001`

## ✅ Testar Funcionalidades

### Agendamento
1. Clique em **"Agendar Consulta"**
2. Preencha os dados (nome, email, telefone, data, horário)
3. Clique em **"Agendar"**

### Área do Cliente
1. Clique em **"Área do Cliente"**
2. Digite o **mesmo número de telefone** usado no agendamento
3. Veja seus agendamentos salvos

### Área do Proprietário
1. Clique em **"Área do Proprietário"**
2. Digite a senha: **`admin123`**
3. Veja **TODOS** os agendamentos de todos os clientes

O importante: **múltiplas abas podem estar abertas** e os dados são compartilhados entre elas!

## 🌐 Deploy no Render (PRODUÇÃO)

### Passo 1: Criar conta no Render (se não tiver)

Acesse: https://render.com

### Passo 2: Criar Web Service

1. Clique em **New +** → **Web Service**
2. Conecte seu repositório GitHub: `gabriel019pira/site-simples`
3. Configure como abaixo

### Passo 3: Configurar Deploy

**Basic Settings:**
- **Name:** `site-simples-backend`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** `Free` (gratuito)
- **Region:** Escolha o mais próximo

**Environment Variables:**
Clique em **Add Environment Variable** e adicione:

```
PORT                 = 3001
NODE_ENV             = production
ADMIN_PASSWORD       = admin123
DB_TYPE              = sqlite
```

### Passo 4: Deploy

Clique em **Create Web Service**

Aguarde ~2-5 minutos. Você verá um link como:
```
https://site-simples-backend.onrender.com
```

### Passo 5: Atualizar Frontend

Edite o arquivo `app.js`:

**Procure por:**
```javascript
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : 'https://site-simples-backend.onrender.com';
```

**Altere para o URL correto** se o Render deu outro nome.

Exemplo: se o Render criou `https://meu-backend-xyz.onrender.com`, mude para:
```javascript
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : 'https://meu-backend-xyz.onrender.com';
```

### Passo 6: Fazer Commit e Push

```bash
git add app.js
git commit -m "Atualizar URL do backend para Render"
git push origin master
```

### Passo 7: Ativar GitHub Pages (Frontend)

1. Vá para: https://github.com/gabriel019pira/site-simples/settings/pages
2. Em "Source", selecione **`master`**
3. Clique em **Save**

Seu site estará disponível em:
🌐 **https://gabriel019pira.github.io/site-simples/**

## ⚠️ Notas Importantes

### Render Free Tier
- **Adormece após 15 minutos** sem uso
- **Pode levar 30-50s para acordar** na primeira requisição
- Dados persistem enquanto a aplicação está rodante
- Para sempre ativo, upgrade para **Render Pay-As-You-Go** (~$7/mês)

### Banco de Dados SQLite no Render
- ✅ Funciona e persiste dados
- ⚠️ Backup automático: NÃO existe
- **Dica:** Faça download periódico de `agendamentos.db`

### Dados Compartilhados
- ✅ Cliente A faz agendamento → Cliente B consegue ver na Área do Cliente
- ✅ Proprietário consegue ver TODOS os agendamentos
- ✅ Dados sincronizam em tempo real entre navegadores

## 🔗 URLs Finais

| Tipo | URL |
|------|-----|
| Site Frontend | `https://gabriel019pira.github.io/site-simples/` |
| Backend API | `https://site-simples-backend.onrender.com` |
| Health Check | `https://site-simples-backend.onrender.com/health` |

## 🚀 Próximas Melhorias (Opcional)

- [ ] Adicionar email automático ao agendar
- [ ] Sistema de cancelamento de agendamentos
- [ ] Dashboard com estatísticas
- [ ] Autenticação de clientes mais robusta
- [ ] Reminders de consultas

## 📞 Suporte

Se algo não funcionar:

1. **Verifique a conexão:**
   ```bash
   curl https://site-simples-backend.onrender.com/health
   ```

2. **Verifique os logs no Render:**
   - https://dashboard.render.com → seu-backend → Logs

3. **Verifique no console do navegador:**
   - Abra DevTools (F12) → Console
   - Procure por mensagens de erro

---

**Pronto! Seu sistema de agendamentos está 100% funcional e compartilhado entre múltiplos usuários!** 🎉

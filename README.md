# Davna — AI Teacher para prática de conversação em inglês

**Demo:** https://davna.yagomarinho.com.br/
**Repositório:** https://github.com/yagomarinho/davna

Davna é uma aplicação que ajuda pessoas a melhorar a conversação em inglês através de um **professor virtual alimentado por IA**, com interface moderna e dinâmica construída em **Next.js + React**, e backend estruturado em um **monorepo TypeScript** com módulos reutilizáveis e serviços especializados (como processamento de mídia via FFmpeg).

---

## 🚀 Tecnologias principais

### **Frontend**

- **Next.js**
- **React**
- **TypeScript**
- Deploy em **Vercel**

### **Backend / Infra**

- **Node.js**
- **FFmpeg** (processamento de mídia)
- **Docker & docker-compose**
- **Monorepo** baseado em workspaces
- Módulos reutilizáveis em `modules/` e `shared/`
- Deploy em EC2 AWS com utilização de Storage

---

## 🧠 Funcionalidades

- Prática de conversação com um **IA Teacher** (voz, escrita e orientação guiada).
- Interface moderna, limpa e responsiva.
- Processamento de áudio/vídeo via serviço isolado com FFmpeg.
- Arquitetura modular para evolução constante:
  - `apps/` — aplicações principais (ex: frontend).
  - `modules/` — pacotes internos compartilháveis.
  - `services/ffmpeg/` — serviço de mídia.
  - `shared/` — utilitários e estruturas comuns.

---

## 📁 Estrutura do Repositório (Monorepo)

```bash
davna/
├── apps/
│   └── web/           # Aplicação Next.js
├── modules/           # Pacotes internos reutilizáveis
├── services/
│   └── ffmpeg/        # Processamento de mídia
├── shared/            # Código compartilhado entre módulos/apps
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

## 🛠️ Como rodar o projeto localmente

Siga os passos abaixo para executar o projeto em ambiente de desenvolvimento.

### 1. Clone o repositório

```bash
git clone https://github.com/yagomarinho/davna.git
cd davna
```

### 2. Crie o arquivo `.env`

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Edite as variáveis conforme suas credenciais e chaves de API.

### 3. Instale as dependências

O projeto utiliza workspaces, portanto a instalação deve ser feita no diretório raiz:

```bash
yarn install
# ou
npm install
```

### 4. (Opcional) Suba os serviços de mídia via Docker

Caso queira usar o serviço de processamento de mídia localmente:

```bash
docker-compose up --build
```

### 5. Execute a aplicação web

Entre na pasta da aplicação (Next.js) e rode o servidor:

```bash
cd apps/web
yarn dev
# ou
npm run dev
```

Acesse em: [http://localhost:3000](http://localhost:3000)

### 6. (Opcional) Rodando outros serviços/apps do monorepo

Dependendo do workspace, você pode iniciar outras aplicações com:

```bash
yarn dev
# ou
npm run dev
```

Consulte o arquivo `package.json` de cada workspace para comandos específicos.

## 📄 Licença

Este projeto está sob a licença MIT — veja o arquivo LICENSE para mais detalhes.

## 📬 Contato

Criado por **Yago Marinho**

- GitHub: [https://github.com/yagomarinho](https://github.com/yagomarinho)
- LinkedIn: [https://www.linkedin.com/in/yago-marinho](https://www.linkedin.com/in/yago-marinho)
- Portfólio: [https://yagomarinho.com.br/](https://yagomarinho.com.br/)

# OPERAÇÃO SETEMBRO

**30 dias. 1 objetivo. Só os fortes viram Monge.**

Aplicação web gamificada para desafio eliminatório de 30 dias entre amigos. Cada participante evolui de Soldado até Monge ∞ — ou cai definitivamente no Cemitério.

> **CAIU, ACABOU.** Uma campanha. Uma tentativa. Uma vida.

## Stack

- React + TypeScript + Vite
- Firebase (Auth, Firestore, Cloud Functions)
- Lucide Icons
- CSS moderno (mobile-first, dark mode)

## Estrutura

```
src/
  components/     # UI reutilizável (AvatarRenderer, Modal, Navigation...)
  pages/          # Telas (Batalha, Ranking, Feed, Cemitério, Perfil)
  layouts/        # Layouts autenticado e público
  contexts/       # AuthContext, CampaignContext
  services/       # Camada de dados (auth, campanha, feed, suporte)
  config/         # gameConfig, ranks, achievements
  utils/          # Lógica de patentes, datas
  types/          # Tipos TypeScript
  assets/characters/ # Retratos 2D de alta fidelidade (canvas canônico 512×512)
  assets/sprites/    # Layers modulares e fallback legado

firebase/
  functions/      # Cloud Functions (check-in, queda, reforços)
  firestore.rules # Regras de segurança
  firestore.indexes.json
```

## Instalação

```bash
npm install
cp .env.example .env
```

## Modo Demo (sem Firebase)

Para visualizar imediatamente com dados fictícios:

```env
VITE_DEMO_MODE=true
```

Contas demo na tela de login (senha: `demo123`):
- `pedrao@demo.com` — PEDRÃO (Capitão, vivo)
- `brunao@demo.com` — BRUNÃO (Tenente, vivo)
- `joao@demo.com` — JOÃO (morto)

```bash
npm run dev
```

## Configuração Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative **Authentication** (Email/Password)
3. Crie um banco **Firestore**
4. Preencha `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_DEMO_MODE=false
```

5. Deploy das regras e functions:

```bash
cd firebase/functions && npm install && npm run build
firebase deploy --only firestore:rules,firestore:indexes,functions
```

6. Crie a campanha no Firestore:

```json
// campaigns/operacao-setembro-2026
{
  "name": "Operação Setembro",
  "year": 2026,
  "startDate": "2026-09-01T00:00:00Z",
  "endDate": "2026-09-30T23:59:59Z",
  "status": "active"
}
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run test` | Testes das regras críticas |
| `npm run lint` | Linting |
| `npm run deploy` | Build + deploy completo no Firebase |
| `npm run deploy:hosting` | Deploy apenas do frontend |

## Deploy (Firebase Hosting)

Tudo é publicado no **Firebase**: frontend, Firestore rules, índices e Cloud Functions.

### Deploy manual

1. Instale e autentique o Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
```

2. Crie o projeto no [Firebase Console](https://console.firebase.google.com) (ou use um existente) e vincule:

```bash
firebase use --add
```

3. Preencha `.env` com as credenciais do Firebase e `VITE_DEMO_MODE=false`

4. Publique tudo:

```bash
npm run deploy
```

Isso executa build do frontend + functions e roda `firebase deploy`.

Comandos úteis:

| Comando | Descrição |
|---------|-----------|
| `npm run deploy` | Hosting + Functions + Firestore rules/indexes |
| `npm run deploy:hosting` | Apenas o frontend |

URL após deploy: `https://<seu-projeto>.web.app`

### Deploy automático (GitHub Actions)

O workflow `.github/workflows/deploy.yml` publica no push para `main`.

Configure estes secrets no repositório:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT` (JSON da service account)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Arquitetura

### Separação User × CampaignPlayer

- `users/{uid}` — conta permanente (nickname, avatarBase)
- `campaigns/{id}/players/{uid}` — participação na campanha

### Operações críticas (Cloud Functions)

| Function | Descrição |
|----------|-----------|
| `joinCampaign` | Entrar na campanha |
| `performCheckIn` | Check-in diário seguro |
| `declareFall` | Queda definitiva |
| `createSupportRequest` | Pedir reforço |
| `strengthenWarrior` | Fortalecer guerreiro |
| `setEpitaph` | Definir epitáfio |

O cliente **não** pode alterar diretamente: `daysSurvived`, `currentRank`, `status`, `fallenAt`, etc.

### Patentes

Configuradas em `src/config/ranks.ts`. Cada patente define:
- Dias mín/máx
- Raridade
- Equipamentos desbloqueados (`avatarConfig`)

### Arte de personagem / Avatar

O sistema usa um canvas canônico de 512×512, com âncoras compartilhadas em
`src/config/avatarArt.ts`. Todas as 15 patentes possuem retratos 2D de alta
fidelidade em `src/assets/characters/ranks/{rankId}/portrait.png`. A definição de
arte por patente também registra faixa visual e elementos de silhueta reutilizáveis.

A galeria completa está disponível em `/evolucao` e pode ser aberta pelo Perfil.
Ela apresenta personagens, nomes e intervalos de dias na ordem integral da campanha.

O `AvatarRenderer` está preparado para a ordem:
effectsBack → cape → body → face → hair → legs → boots → torso → armor → belt →
shoulders → weapon → headgear → effectsFront.

Rosto e cabelo fazem parte da configuração do avatar, permitindo evoluir para
customização de tom de pele, estilo/cor do cabelo e barba sem alterar os dados da
campanha. Novas configurações recebem `portrait` automaticamente a partir da patente;
para documentos antigos, o `AvatarRenderer` usa `rankId` como fallback. Isso evita
migração no Firestore e preserva os snapshots de morte existentes.

**Adicionar equipamento:**
1. Crie o SVG em `assets/sprites/{categoria}/`
2. Referencie em `ranks.ts` → `avatarConfig`

**Adicionar personagem base:**
1. Crie `base-c.svg` em `assets/sprites/base/`
2. Adicione ao tipo `AvatarBase` e ao seletor de registro

### Conquistas

Definidas em `src/config/achievements.ts`. Adicione um objeto com `condition(player)`.

### Cooldown de reforço

Altere `SUPPORT_REQUEST_COOLDOWN_HOURS` em `src/config/gameConfig.ts`.

### Nova campanha

1. Crie documento em `campaigns/{novo-id}`
2. Ajuste datas e `status: 'active'`
3. Desative campanha anterior (`status: 'finished'`)

## Testes

```bash
npm run test
```

Cobertura das regras críticas:
- Cálculo de patente e promoção
- Check-in duplicado
- Fallen não pode voltar
- Ranking vs Cemitério
- Regras de reforço
- Snapshot de morte

## Licença

Projeto privado — uso entre amigos.

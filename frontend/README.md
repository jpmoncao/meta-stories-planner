# Meta Stories Planner - Frontend

Frontend com Astro + React para upload de imagens ao Firebase Storage.

## 🔧 Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative o **Storage** no seu projeto
3. Copie `env.example` para `.env` e preencha com as credenciais do Firebase
4. Configure as regras do Storage (exemplo para desenvolvimento):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{allPaths=**} {
      allow read, write: if true;  // Ajuste para produção com autenticação
    }
  }
}
```

## 🚀 Estrutura do Projeto

```text
/
├── public/
├── src/
│   ├── components/
│   │   └── ImageUpload.tsx   # Componente React de upload
│   ├── lib/
│   │   └── firebase.ts       # Configuração do Firebase
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

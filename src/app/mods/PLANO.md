# MODS — Super Productivity Personalizado

**Inspiração:** Perfil SpaceHey de 03s9

---

## TECNOLOGIA E FRAMEWORK

| Camada              | Tecnologia                               | Por quê                              |
| ------------------- | ---------------------------------------- | ------------------------------------ |
| Framework           | **Angular 17 Standalone Components**     | Já é o que o app usa — zero fricção  |
| Estilo              | **SCSS + CSS Custom Properties**         | Theming dinâmico sem JS extra        |
| Animações sprites   | **CSS keyframes + sprite sheets / GIFs** | Leve, sem biblioteca extra           |
| Partículas          | **Canvas API**                           | Performance nativa, zero dependência |
| Cursor customizado  | **CSS `cursor: url()`**                  | Suporte universal no browser         |
| Persistência        | **localStorage + IndexedDB** (já usado)  | Consistente com o resto do app       |
| Arquivos de usuário | **IndexedDB** via service já existente   | Stamps e cursores importados         |

---

## ESTRUTURA DE PASTAS

```
src/app/mods/
├── PLANO.md                        ← este arquivo
├── mods.service.ts                 ← config global de todos os mods
├── mods-panel/                     ← painel de controle de todas as mods
│   ├── mods-panel.component.ts
│   ├── mods-panel.component.html
│   └── mods-panel.component.scss
│
├── anime-corner/                   ← sprites animados nos cantos da tela
│   ├── anime-corner.component.ts
│   ├── anime-corner.component.html
│   └── anime-corner.component.scss
│
├── custom-cursor/                  ← cursor do mouse personalizado
│   └── custom-cursor.service.ts
│
├── stamps/                         ← coleção de stamps igual SpaceHey
│   ├── stamps.component.ts
│   ├── stamps.component.html
│   └── stamps.component.scss
│
└── particles/                      ← partículas/estrelas no fundo
    ├── particles.component.ts
    └── particles.component.scss
```

---

## FEATURES PLANEJADAS

### 1. ANIME CORNER — Sprites Animados

- Personagens animados fixos nos cantos da tela (como no SpaceHey)
- Suporte a GIF ou sprite sheet CSS
- Até 2 sprites simultâneos (canto inferior esquerdo e inferior direito)
- Biblioteca de sprites pré-incluídos para escolher
- **Opção de importar GIF próprio**
- Toggle para mostrar/esconder
- Tamanho ajustável (pequeno/médio/grande)

### 2. CUSTOM CURSOR — Cursor Personalizado

- Aplicado via CSS `cursor: url()` no `<body>`
- Biblioteca de cursores pré-definidos (seta anime, mãozinha, crosshair)
- **Opção de importar cursor .cur / .png próprio**
- Hotspot configurável (ponto de clique)

### 3. STAMPS COLLECTION — Coleção de Stamps

- Widget flutuante ou painel lateral com stamps, igual ao SpaceHey
- Stamps são imagens 100×100 px (formato padrão do SpaceHey)
- Adicionar stamp via URL ou upload de arquivo
- Drag para reordenar
- Armazenados no IndexedDB
- Clicar no stamp abre link externo (opcional)
- Exibição: grade de stamps visível na sidebar ou num painel pop-up

### 4. PARTICLES — Partículas de Fundo

- Canvas cobrindo toda a tela atrás do conteúdo
- Modos: estrelas flutuando / pétalas caindo / neve / bolhas
- Velocidade e quantidade configuráveis
- Performance: pausa quando aba fica em background (Page Visibility API)

### 5. MODS PANEL — Painel de Controle

- Botão flutuante ⚙️ (ao lado do botão de som já existente)
- Abre painel com tabs para cada mod
- Toda configuração salva em localStorage (`sp-mods-config`)

---

## ORDEM DE IMPLEMENTAÇÃO

```
Fase 1  →  ModsService + ModsPanel (estrutura base)
Fase 2  →  Custom Cursor (mais simples, impacto imediato)
Fase 3  →  Stamps Collection (coração da identidade SpaceHey)
Fase 4  →  Anime Corner sprites
Fase 5  →  Particles / fundo animado
```

---

## MODELO DE CONFIG (localStorage)

```typescript
interface ModsConfig {
  cursor: {
    enabled: boolean;
    preset: string; // 'default' | 'arrow-anime' | 'custom'
    customUrl?: string;
  };
  stamps: {
    visible: boolean;
    position: 'sidebar' | 'floating';
    items: StampItem[]; // { url, link?, label? }
  };
  animeCorner: {
    enabled: boolean;
    bottomLeft?: SpriteConfig;
    bottomRight?: SpriteConfig;
  };
  particles: {
    enabled: boolean;
    mode: 'stars' | 'petals' | 'snow' | 'bubbles';
    count: number; // 20-200
    speed: number; // 0.1-2.0
  };
}
```

---

## NOTAS TÉCNICAS

- Todos os componentes são **standalone** — sem NgModule
- Todos são adicionados ao `app.component.html` com `@if (modsConfig.X.enabled)`
- O `ModsService` usa `signal<ModsConfig>()` para reatividade
- Nada dos mods quebra as features existentes — são **somente adições**
- O backup `_backup-pre-mods/` guarda o estado anterior completo

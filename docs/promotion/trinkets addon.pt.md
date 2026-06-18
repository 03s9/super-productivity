---
layout: default
title: 'Trinkets Addon'
permalink: /trinkets-addon/pt/
---

<div align="center">

# Trinkets Addon

### Para Super Productivity

**Transforme sua produtividade em uma aventura de pets colecionáveis.**

[![Versão](https://img.shields.io/badge/Versao-1.1.0-ff7b00?style=for-the-badge&logo=semantic-release)](https://github.com/03s9/super-productivity)
[![App](https://img.shields.io/badge/App-Super%20Productivity-3b82f6?style=for-the-badge)](https://super-productivity.com)
[![Branch](https://img.shields.io/badge/Branch-mods-22c55e?style=for-the-badge)](https://github.com/03s9/super-productivity/tree/mods)

[English](..%2Ftrinkets%20addon.md) | [Portugues](#trinkets-addon)

</div>

---

## Informações do Mod

| Campo                  | Valor                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **Autor Original**     | [Johannes Millan](https://github.com/johannesjo) e contribuidores do Super Productivity |
| **Autor do Mod**       | [03s9](https://github.com/03s9)                                                         |
| **Versao**             | 1.1.0                                                                                   |
| **Categoria**          | Gameplay / Cosméticos                                                                   |
| **Branch**             | [`mods`](https://github.com/03s9/super-productivity/tree/mods)                          |
| **Licença**            | MIT (camada do mod) — respeita a licenca do Super Productivity original                 |
| **Ultima Atualização** | 18 de junho de 2026                                                                     |

---

## Sobre Este Mod

O **Trinkets Addon** adiciona uma camada de recompensas ao Super Productivity. Toda vez que você completa tarefas, ganha chances de desbloquear companheiros 3D fofos, coletar moedas e decorar sua área de trabalho com pets arrastáveis que flutuam pela tela.

### Funcionalidades

- **Prateleira de Troféus 3D** — Uma prateleira em Three.js mostrando todos os cube-pets desbloqueados.
- **Sistema de Lootbox** — Ganhe uma lootbox a cada 5 ou 10 tarefas completadas.
- **Economia de Moedas** — Trinkets duplicados sao convertidos em moedas em vez de bloquear seu progresso.
- **Companheiros na Tela** — Coloque ate 6 pets desbloqueados diretamente na area de trabalho e arraste-os para qualquer lugar.
- **Cores por Espécie** — Cada animal tem sua própria paleta de cores do atlas Kenney.
- **Progresso Persistente** — Tudo e salvo no `localStorage` com retrocompatibilidade.
- **Companheiro em Destaque** — Fixe seu pet favorito como companheiro principal.

---

## Capturas de Tela

> _(As capturas de tela serão adicionadas quando a UI for finalizada.)_

<div align="center">

| Prateleira de Trofeus | Popup de Lootbox | Companion na Area de Trabalho |
| :-------------------: | :--------------: | :---------------------------: |
|      _Em breve_       |    _Em breve_    |          _Em breve_           |

</div>

---

## Requisitos

- Super Productivity (este fork)
- Node.js `22.18.0` (pinado pelo Volta)
- Dependências instaladas via `npm install` (inclui `three` e `@types/three`)

---

## Instalação

### Opção A: Executar pelo código-fonte

```bash
git clone https://github.com/03s9/super-productivity.git
cd super-productivity
git checkout mods
npm install
npm start
```

### Opcao B: Build web

```bash
git checkout mods
npm run buildFrontend:prodWeb
```

Depois sirva o conteúdo de `.tmp/angular-dist/browser`.

---

## Como Usar

1. Complete tarefas normalmente.
2. A cada 5 ou 10 tarefas, um **popup de lootbox** aparece.
3. Abra para desbloquear um novo trinket ou ganhar moedas por duplicatas.
4. Clique no ícone de troféu para abrir sua **Prateleira de Trofeus**.
5. Clique em **"Colocar na tela"** para colocar um pet na area de trabalho.
6. Arraste os pets; passe o mouse e clique no botão de remover para tirá-los.

---

## Changelog

### v1.1.0 — Trinkets Addon

- Adicionado **Companion Overlay** arrastável (ate 6 pets na tela).
- Movido `ANIMAL_COLORS` para o modelo compartilhado para reutilização.
- Adicionado toggle "Colocar na tela / Na tela" na Prateleira de Trofeus.
- Posições dos companions persistidas no `localStorage`.

### v1.0.0 — Sistema de Trinkets

- 24 Kenney Cube Pets em uma Prateleira 3D.
- Lootbox a cada 5/10 tarefas com pesos por raridade.
- Trinkets duplicados concedem moedas (10/25/50/100).
- Estado distinto no popup para trinket novo vs. duplicata.
- Saldo de moedas exibido no header da prateleira.
- Botao "Destacar" seleciona o companheiro principal do app.
- Widget de companion flutuante.

---

## Créditos

- **[Johannes Millan](https://github.com/johannesjo)** — Autor original do Super Productivity
- **Contribuidores do Super Productivity** — Mantenedores upstream e comunidade
- **[03s9](https://github.com/03s9)** — Autor do mod Trinkets Addon
- **[Kenney](https://kenney.nl/assets/cube-pets)** — Modelos 3D Cube Pets

---

## Suporte

Este e um fork pessoal. Se voce gostou do mod, considere apoiar o projeto original:

[Dê uma estrela ao Super Productivity no GitHub](https://github.com/johannesjo/super-productivity)

---

<div align="center">

**Boa produtividade, herói.**

</div>

# Trinket Shelf — Diagnóstico dos Bugs

## Problema 1: Modelos apareciam como silhuetas cinzas

**Causa:** O mapa `ANIMAL_COLORS` usava chaves curtas (`cat`, `dog`…) mas os IDs reais no `trinkets.json` têm prefixo (`animal-cat`, `animal-dog`…). O lookup sempre retornava `undefined`, caindo no fallback cinza `0x888888` para todos os animais.

**Fix:** Converter `ANIMAL_COLORS` de objeto literal para `Map<string, number>` com as chaves corretas (`animal-cat`, etc.).

---

## Problema 2: Cores sendo aplicadas mas forma 3D invisível

**Causa:** Dois fatores combinados eliminavam todo o sombreamento 3D:

- `AmbientLight` com intensidade `1.4` — luz ambiente excessiva preenche todas as sombras, deixando os modelos com aparência de bola plana.
- `emissiveIntensity = 0.3` — fazer o material emitir luz própria cancela o shading direcional que define orelhas, chifres, nadadeiras e outras formas características.

**Fix:** Reduzir ambient para `0.5`, remover o emissive (`intensity = 0`), aumentar a key light para `1.8` e adicionar uma fill light secundária.

---

## Problema 3: Textura ausente (causa raiz da cor sólida)

**Causa:** Os 24 GLBs do Kenney Cube Pets referenciam uma textura **externa** via `"uri":"Textures/colormap.png"`. O arquivo não estava nos assets do projeto, então o Three.js falhava silenciosamente ao carregá-la e `material.map` ficava `null`, fazendo o código cair na pintura de cor sólida.

**Fix:** Copiar `colormap.png` da pasta `GLB format/Textures/` do pack original do Kenney para `src/assets/trinkets/models/Textures/colormap.png`. Com o arquivo no lugar correto, o GLTFLoader resolve a referência relativa automaticamente e as texturas aparecem sem nenhuma mudança de código.

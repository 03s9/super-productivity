/* eslint-disable no-mixed-operators */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TrinketService } from '../trinket.service';
import { TrinketDef, TrinketRarity, RARITY_COLOR, RARITY_LABEL } from '../trinket.model';

const SPOTS_PER_ROW = 8;

// Colors keyed by the actual trinket id (matches trinkets.json "id" field).
// Applied whenever the GLB material has no embedded texture — overrides the
// neutral/gray default the GLTF exporter bakes in. Map avoids naming-convention
// lint errors that object literals with hyphenated keys would trigger.
const ANIMAL_COLORS = new Map<string, number>([
  ['animal-cat', 0xe8975a],
  ['animal-dog', 0xc4813a],
  ['animal-bunny', 0xf0ddc8],
  ['animal-chick', 0xf5d84a],
  ['animal-pig', 0xf0a8a0],
  ['animal-fish', 0x5ab4f0],
  ['animal-bee', 0xf5c832],
  ['animal-parrot', 0x45c832],
  ['animal-penguin', 0x404848],
  ['animal-fox', 0xe07030],
  ['animal-beaver', 0x8a5c2c],
  ['animal-koala', 0x909090],
  ['animal-cow', 0xe8e4d8],
  ['animal-monkey', 0xc48030],
  ['animal-deer', 0xc8924a],
  ['animal-panda', 0xe8e8e8],
  ['animal-crab', 0xe83030],
  ['animal-caterpillar', 0x60c040],
  ['animal-hog', 0xe0a0c0],
  ['animal-polar', 0xf0f0f8],
  ['animal-elephant', 0x8090a8],
  ['animal-giraffe', 0xe8c850],
  ['animal-lion', 0xe0a840],
  ['animal-tiger', 0xe87030],
]);
const SHELF_WIDTH = 9;
const SHELF_GAP_Y = 1.9;
const SHELF_HEIGHTS = [-0.2, SHELF_GAP_Y - 0.2, SHELF_GAP_Y * 2 - 0.2];
const SPOT_SPACING = SHELF_WIDTH / SPOTS_PER_ROW;
const MODEL_SCALE = 0.65;

@Component({
  selector: 'trophy-shelf',
  standalone: true,
  templateUrl: './trophy-shelf.component.html',
  styleUrls: ['./trophy-shelf.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon],
})
export class TrophyShelfComponent implements OnDestroy {
  @ViewChild('canvas', { static: false })
  private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly _svc = inject(TrinketService);

  readonly isOpen = this._svc.shelfOpen;
  readonly selected = signal<TrinketDef | null>(null);

  readonly selectedRarityLabel = computed(() => {
    const s = this.selected();
    return s ? RARITY_LABEL[s.raridade] : '';
  });
  readonly selectedRarityColor = computed(() => {
    const s = this.selected();
    return s ? RARITY_COLOR[s.raridade] : '#fff';
  });
  readonly selectedPreview = computed(() => {
    const s = this.selected();
    return s ? `assets/trinkets/previews/${s.preview}` : '';
  });
  readonly unlockedCount = this._svc.unlockedIds;
  readonly coins = this._svc.coins;
  readonly featuredId = this._svc.featuredId;

  setFeatured(id: string): void {
    this._svc.setFeatured(id);
  }

  private _renderer!: THREE.WebGLRenderer;
  private _scene!: THREE.Scene;
  private _camera!: THREE.PerspectiveCamera;
  private _controls!: OrbitControls;
  private _raycaster = new THREE.Raycaster();
  private _pointer = new THREE.Vector2();
  private _modelMeshes = new Map<string, THREE.Object3D>();
  private _animId = 0;
  private _resizeObs!: ResizeObserver;

  constructor() {
    // Watch for the shelf opening and initialise Three.js after the
    // canvas element becomes available in the DOM (next microtask).
    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => this._init(), 0);
      } else {
        this._cleanup();
      }
    });
  }

  ngOnDestroy(): void {
    this._cleanup();
  }

  open(): void {
    this._svc.shelfOpen.set(true);
    setTimeout(() => this._init(), 50);
  }

  close(): void {
    this._cleanup();
    this._svc.shelfOpen.set(false);
    this.selected.set(null);
  }

  onCanvasClick(event: MouseEvent): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this._camera || !this._renderer) return;
    const rect = canvas.getBoundingClientRect();
    this._pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this._raycaster.setFromCamera(this._pointer, this._camera);
    const meshes: THREE.Object3D[] = [];
    this._modelMeshes.forEach((obj) => meshes.push(obj));
    const hits = this._raycaster.intersectObjects(meshes, true);
    if (!hits.length) {
      this.selected.set(null);
      return;
    }
    let obj: THREE.Object3D | null = hits[0].object;
    while (obj && !obj.userData['trinketId']) obj = obj.parent;
    if (obj?.userData['trinketId']) {
      const t = this._svc.allTrinkets.find((x) => x.id === obj!.userData['trinketId']);
      this.selected.set(t ?? null);
    }
  }

  private _init(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || this._renderer) return;

    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;

    // Renderer
    this._renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(w, h);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._renderer.toneMapping = THREE.LinearToneMapping;
    this._renderer.toneMappingExposure = 1.0;
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Scene
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x2a1c0e);
    this._scene.fog = new THREE.Fog(0x2a1c0e, 12, 25);

    // Camera
    this._camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 50);
    this._camera.position.set(0, 2.5, 8.5);
    this._camera.lookAt(0, 1.8, 0);

    // Controls
    this._controls = new OrbitControls(this._camera, canvas);
    this._controls.target.set(0, 1.8, 0);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.07;
    this._controls.minDistance = 3;
    this._controls.maxDistance = 12;
    this._controls.maxPolarAngle = Math.PI * 0.65;
    this._controls.minPolarAngle = Math.PI * 0.2;

    this._buildScene();
    this._loadTrinkets();
    this._startLoop();

    this._resizeObs = new ResizeObserver(() => this._onResize());
    this._resizeObs.observe(canvas);
  }

  private _buildScene(): void {
    // ── Back wall — lighter warm brown so models are visible against it
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x3a2510,
      roughness: 0.9,
      metalness: 0,
    });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), wallMat);
    wall.position.set(0, 2, -1.3);
    wall.receiveShadow = true;
    this._scene.add(wall);

    // Side walls for depth
    const sideWallGeo = new THREE.PlaneGeometry(6, 12);
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-6.5, 2, 1.5);
    this._scene.add(leftWall);
    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(6.5, 2, 1.5);
    this._scene.add(rightWall);

    // ── Floor
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x2a1c0e,
      roughness: 0.85,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.5;
    floor.receiveShadow = true;
    this._scene.add(floor);

    // ── Shelves
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0x7a4f28,
      roughness: 0.7,
      metalness: 0.05,
    });
    const bracketMat = new THREE.MeshStandardMaterial({
      color: 0xb08830,
      roughness: 0.35,
      metalness: 0.8,
    });

    SHELF_HEIGHTS.forEach((sy) => {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(SHELF_WIDTH + 0.4, 0.1, 0.55),
        shelfMat,
      );
      plank.position.set(0, sy, 0);
      plank.castShadow = true;
      plank.receiveShadow = true;
      this._scene.add(plank);

      [-SHELF_WIDTH / 2 - 0.05, SHELF_WIDTH / 2 + 0.05].forEach((bx) => {
        const br = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.35, 0.5), bracketMat);
        br.position.set(bx, sy - 0.2, 0);
        br.castShadow = true;
        this._scene.add(br);
      });

      // Thin shelf-edge highlight strip
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(SHELF_WIDTH + 0.4, 0.015, 0.04),
        new THREE.MeshStandardMaterial({
          color: 0xd4a855,
          roughness: 0.3,
          metalness: 0.6,
        }),
      );
      edge.position.set(0, sy + 0.057, 0.26);
      this._scene.add(edge);
    });

    // Balanced lighting: low ambient preserves 3D shading so model shapes are
    // readable; the two directional lights provide warm key + cool fill.
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this._scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff4e8, 1.8);
    key.position.set(3, 7, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this._scene.add(key);

    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.4);
    fill.position.set(-4, 3, 4);
    this._scene.add(fill);
  }

  private _loadTrinkets(): void {
    const loader = new GLTFLoader();
    const all = this._svc.allTrinkets;
    const unlockedIds = this._svc.unlockedIds();

    all.forEach((t, i) => {
      const row = Math.floor(i / SPOTS_PER_ROW);
      const col = i % SPOTS_PER_ROW;
      const x = -SHELF_WIDTH / 2 + SPOT_SPACING * 0.5 + col * SPOT_SPACING;
      const y = SHELF_HEIGHTS[row] + 0.55;
      const z = 0;

      if (!unlockedIds.includes(t.id)) {
        this._addLockedSlot(x, y, z);
        return;
      }

      if (t.raridade === 'raro' || t.raridade === 'epico') {
        this._scene.add(this._makeGlowSprite(x, y + 0.1, t.raridade));
      }

      loader.load(
        `assets/trinkets/models/${t.modelo}`,
        (gltf) => {
          const model = gltf.scene;

          const rawBox = new THREE.Box3().setFromObject(model);
          const rawSize = new THREE.Vector3();
          rawBox.getSize(rawSize);
          const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
          model.scale.setScalar(MODEL_SCALE / maxDim);

          const box = new THREE.Box3().setFromObject(model);
          const center = new THREE.Vector3();
          box.getCenter(center);
          model.position.set(x - center.x, y - box.min.y, z - center.z);

          model.userData['trinketId'] = t.id;
          model.userData['baseY'] = model.position.y;

          // Apply the animal's color to every material that has no embedded
          // texture. The GLBs from Kenney Cube Pets ship with a neutral gray
          // material — we replace it unconditionally so the correct color shows.
          const animalHex = ANIMAL_COLORS.get(t.id) ?? 0x888888;
          model.traverse((child) => {
            child.userData['trinketId'] = t.id;
            const mesh = child as THREE.Mesh;
            if (!mesh.isMesh) return;
            mesh.castShadow = true;
            const paint = (m: THREE.Material): void => {
              const std = m as THREE.MeshStandardMaterial;
              if (std.map) return; // embedded texture — leave it alone
              std.color.setHex(animalHex);
              std.emissive.set(0, 0, 0); // no self-glow — keeps 3D shading visible
              std.emissiveIntensity = 0;
              std.roughness = 0.65;
              std.needsUpdate = true;
            };
            if (Array.isArray(mesh.material)) {
              (mesh.material as THREE.Material[]).forEach(paint);
            } else {
              paint(mesh.material);
            }
          });

          this._scene.add(model);
          this._modelMeshes.set(t.id, model);
        },
        undefined,
        // eslint-disable-next-line no-console
        (err) => console.warn('trinket load error', t.id, err),
      );
    });
  }

  private _addLockedSlot(x: number, y: number, z: number): void {
    const geo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.35,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.19, z);
    this._scene.add(mesh);
  }

  private _startLoop(): void {
    const tick = (): void => {
      this._animId = requestAnimationFrame(tick);
      this._controls.update();

      // Gentle bob + slow y-rotation so 3D depth is visible
      const t = performance.now() * 0.001;
      this._modelMeshes.forEach((obj, id) => {
        const i = this._svc.allTrinkets.findIndex((x) => x.id === id);
        const baseY = obj.userData['baseY'] as number;
        obj.position.y = baseY + Math.sin(t * 0.6 + i * 0.5) * 0.025;
        obj.rotation.y = Math.sin(t * 0.35 + i * 0.7) * 0.3;
      });

      this._renderer.render(this._scene, this._camera);
    };
    tick();
  }

  private _makeGlowSprite(x: number, y: number, raridade: TrinketRarity): THREE.Sprite {
    const size = 128;
    const cvs = document.createElement('canvas');
    cvs.width = size;
    cvs.height = size;
    const ctx = cvs.getContext('2d')!;
    const hex = RARITY_COLOR[raridade];
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const hs = size / 2;
    const grad = ctx.createRadialGradient(hs, hs, 0, hs, hs, hs);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.95)`);
    grad.addColorStop(0.35, `rgba(${r},${g},${b},0.5)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const mat = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cvs),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    const scale = raridade === 'epico' ? 1.4 : 1.0;
    sprite.scale.set(scale, scale, 1);
    sprite.position.set(x, y + 0.25, -0.2);
    return sprite;
  }

  private _onResize(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this._renderer) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h);
  }

  private _cleanup(): void {
    cancelAnimationFrame(this._animId);
    this._resizeObs?.disconnect();
    this._renderer?.dispose();
    (this._renderer as unknown) = undefined!;
    this._modelMeshes.clear();
  }
}

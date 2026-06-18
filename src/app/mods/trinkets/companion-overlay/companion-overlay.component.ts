/* eslint-disable no-mixed-operators */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TrinketService } from '../trinket.service';
import { ANIMAL_COLORS, PlacedCompanion } from '../trinket.model';

const TARGET_PX = 72;

@Component({
  selector: 'companion-overlay',
  standalone: true,
  templateUrl: './companion-overlay.component.html',
  styleUrls: ['./companion-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanionOverlayComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  private readonly _canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly _svc = inject(TrinketService);
  private readonly _zone = inject(NgZone);

  private _renderer!: THREE.WebGLRenderer;
  private _scene!: THREE.Scene;
  private _camera!: THREE.OrthographicCamera;
  private _models = new Map<string, THREE.Object3D>();
  private _animId = 0;
  private _w = 0;
  private _h = 0;
  private _sceneReady = false;
  private _loader = new GLTFLoader();
  private _drag: { id: string; ox: number; oy: number; mx: number; my: number } | null =
    null;
  private _resizeObs!: ResizeObserver;

  private readonly _moveHandler = (e: MouseEvent): void => this._onMove(e);
  private readonly _upHandler = (): void => this._onUp();

  constructor() {
    effect(() => {
      const companions = this._svc.placedCompanions();
      if (this._sceneReady) {
        this._syncModels(companions);
      }
    });
  }

  ngAfterViewInit(): void {
    this._zone.runOutsideAngular(() => {
      this._init();
      window.addEventListener('mousemove', this._moveHandler);
      window.addEventListener('mouseup', this._upHandler);
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this._animId);
    this._resizeObs?.disconnect();
    window.removeEventListener('mousemove', this._moveHandler);
    window.removeEventListener('mouseup', this._upHandler);
    this._renderer?.dispose();
  }

  onDragStart(ev: MouseEvent, trinketId: string): void {
    ev.preventDefault();
    const c = this._svc.placedCompanions().find((p) => p.trinketId === trinketId);
    if (!c) return;
    this._drag = { id: trinketId, ox: c.x, oy: c.y, mx: ev.clientX, my: ev.clientY };
  }

  onRemove(trinketId: string): void {
    this._svc.removeCompanion(trinketId);
  }

  private _init(): void {
    const canvas = this._canvasRef.nativeElement;
    this._w = window.innerWidth;
    this._h = window.innerHeight;

    this._renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(this._w, this._h);
    this._renderer.setClearColor(0x000000, 0);
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;
    this._renderer.toneMapping = THREE.LinearToneMapping;

    this._scene = new THREE.Scene();

    this._camera = new THREE.OrthographicCamera(
      -this._w / 2,
      this._w / 2,
      this._h / 2,
      -this._h / 2,
      0.1,
      500,
    );
    this._camera.position.z = 200;

    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    this._scene.add(ambient);
    const key = new THREE.DirectionalLight(0xfff8e0, 1.6);
    key.position.set(2, 3, 4);
    this._scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.5);
    fill.position.set(-2, 1, 3);
    this._scene.add(fill);

    this._sceneReady = true;
    this._zone.run(() => {
      this._syncModels(this._svc.placedCompanions());
    });
    this._startLoop();

    this._resizeObs = new ResizeObserver(() => this._onResize());
    this._resizeObs.observe(document.documentElement);
  }

  private _syncModels(companions: PlacedCompanion[]): void {
    for (const [id, model] of this._models) {
      if (!companions.find((c) => c.trinketId === id)) {
        this._scene.remove(model);
        this._models.delete(id);
      }
    }
    for (const c of companions) {
      if (!this._models.has(c.trinketId)) {
        this._loadModel(c.trinketId, c.x, c.y);
      }
    }
  }

  private _loadModel(trinketId: string, fracX: number, fracY: number): void {
    const t = this._svc.allTrinkets.find((x) => x.id === trinketId);
    if (!t) return;

    this._loader.load(
      `assets/trinkets/models/${t.modelo}`,
      (gltf) => {
        const model = gltf.scene;

        const rawBox = new THREE.Box3().setFromObject(model);
        const rawSize = new THREE.Vector3();
        rawBox.getSize(rawSize);
        const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
        model.scale.setScalar(TARGET_PX / maxDim);

        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const { wx, wy } = this._fracToWorld(fracX, fracY);
        model.position.set(wx - center.x, wy - center.y, 0);

        model.userData['trinketId'] = trinketId;
        model.userData['baseFracX'] = fracX;
        model.userData['baseFracY'] = fracY;

        const animalHex = ANIMAL_COLORS.get(trinketId) ?? 0x888888;
        model.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;
          const paint = (m: THREE.Material): void => {
            const std = m as THREE.MeshStandardMaterial;
            if (std.map) return;
            std.color.setHex(animalHex);
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
        this._models.set(trinketId, model);
      },
      undefined,
      // eslint-disable-next-line no-console
      (err) => console.warn('companion load error', trinketId, err),
    );
  }

  private _fracToWorld(fracX: number, fracY: number): { wx: number; wy: number } {
    return {
      wx: fracX * this._w - this._w / 2,
      wy: -(fracY * this._h - this._h / 2),
    };
  }

  private _startLoop(): void {
    const tick = (): void => {
      this._animId = requestAnimationFrame(tick);
      const t = performance.now() * 0.001;
      let i = 0;
      for (const [, model] of this._models) {
        const bfx = model.userData['baseFracX'] as number;
        const bfy = model.userData['baseFracY'] as number;
        const { wx, wy } = this._fracToWorld(bfx, bfy);
        model.position.x = wx;
        model.position.y = wy + Math.sin(t * 0.7 + i * 1.1) * 5;
        model.rotation.y = Math.sin(t * 0.4 + i * 0.9) * 0.35;
        i++;
      }
      this._renderer.render(this._scene, this._camera);
    };
    tick();
  }

  private _onMove(ev: MouseEvent): void {
    if (!this._drag) return;
    const dx = ev.clientX - this._drag.mx;
    const dy = ev.clientY - this._drag.my;
    const model = this._models.get(this._drag.id);
    if (model) {
      model.userData['baseFracX'] = Math.max(
        0.04,
        Math.min(0.96, this._drag.ox + dx / this._w),
      );
      model.userData['baseFracY'] = Math.max(
        0.04,
        Math.min(0.96, this._drag.oy + dy / this._h),
      );
    }
  }

  private _onUp(): void {
    if (!this._drag) return;
    const model = this._models.get(this._drag.id);
    if (model) {
      const fx = model.userData['baseFracX'] as number;
      const fy = model.userData['baseFracY'] as number;
      this._zone.run(() => {
        this._svc.updateCompanionPosition(this._drag!.id, fx, fy);
      });
    }
    this._drag = null;
  }

  private _onResize(): void {
    this._w = window.innerWidth;
    this._h = window.innerHeight;
    if (!this._renderer) return;
    this._renderer.setSize(this._w, this._h);
    this._camera.left = -this._w / 2;
    this._camera.right = this._w / 2;
    this._camera.top = this._h / 2;
    this._camera.bottom = -this._h / 2;
    this._camera.updateProjectionMatrix();
  }
}

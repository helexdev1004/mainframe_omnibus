// WebGL renderer for the globe – used when the browser has a real GPU.
// Loaded on demand, so machines that take the Canvas 2D path never download
// three.js at all.
import * as THREE from "three";
import {
  ARC_STEPS,
  BEACON_HALF,
  CAMERA_Z,
  DOT_SIZE,
  FOV,
  HALF_FOV_TAN,
  AXIS_LEAN,
  LINKS,
  MARKET_VECTORS,
  ORBITS,
  arcPoints,
  arcTiming,
  beaconPhase,
  buildDots,
  buildDust,
  nodeSize,
  orbitPoint,
  type GlobeFrame,
  type GlobeRenderer,
  type Vec3,
} from "./config";
import {
  arcFragment,
  arcVertex,
  beaconFragment,
  beaconVertex,
  dotsFragment,
  dotsVertex,
  lineVertex,
  orbitFragment,
  sparkFragment,
  sparkVertex,
} from "./shaders";

function glow(params: THREE.ShaderMaterialParameters) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    ...params,
  });
}

export function createWebGLRenderer(): GlobeRenderer {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 40);
  camera.position.z = CAMERA_Z;

  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(item: T) => {
    disposables.push(item);
    return item;
  };

  // Uniforms shared between materials
  const uTime = { value: 0 };
  const uPxPerUnit = { value: 1 };
  const uIntroDots = { value: 0 };
  const uIntroLines = { value: 0 };
  const uIntroFx = { value: 0 };

  // rig: pointer parallax, drift, scale · tilt: axial lean · spin: rotation
  const rig = new THREE.Group();
  const tiltGroup = new THREE.Group();
  const spinGroup = new THREE.Group();
  tiltGroup.rotation.z = AXIS_LEAN;
  scene.add(rig);
  rig.add(tiltGroup);
  tiltGroup.add(spinGroup);

  // The visible sphere is a still image under this canvas (see plate.ts).
  // Here it only writes depth, hiding whatever passes behind the globe.
  rig.add(
    new THREE.Mesh(
      track(new THREE.SphereGeometry(0.997, 72, 48)),
      track(new THREE.MeshBasicMaterial({ colorWrite: false })),
    ),
  );

  /* ---- dot matrix ---- */
  const cloud = buildDots(true);
  const rippleOrigin = [new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 1)];
  const rippleShape = [new THREE.Vector3(1, 1, 0), new THREE.Vector3(1, 1, 0)];
  const dotGeometry = track(new THREE.BufferGeometry());
  dotGeometry.setAttribute("position", new THREE.BufferAttribute(cloud.position, 3));
  dotGeometry.setAttribute("aScatter", new THREE.BufferAttribute(cloud.scatter, 3));
  dotGeometry.setAttribute("aSeed", new THREE.BufferAttribute(cloud.seed, 2));
  const dots = new THREE.Points(
    dotGeometry,
    track(
      glow({
        vertexShader: dotsVertex,
        fragmentShader: dotsFragment,
        uniforms: {
          uTime,
          uPxPerUnit,
          uIntro: uIntroDots,
          uDot: { value: DOT_SIZE },
          uSea: { value: 0.085 },
          uRippleOrigin: { value: rippleOrigin },
          uRipple: { value: rippleShape },
        },
      }),
    ),
  );
  dots.frustumCulled = false;
  spinGroup.add(dots);

  /* ---- market beacons: six tangent quads, one draw call ---- */
  const beaconPing = MARKET_VECTORS.map(() => 0);
  {
    const vertices: number[] = [];
    const uvs: number[] = [];
    const info: number[] = [];
    const index: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3();
    const t1 = new THREE.Vector3();
    const t2 = new THREE.Vector3();
    const corner = new THREE.Vector3();
    MARKET_VECTORS.forEach((market, i) => {
      normal.fromArray(market);
      t1.crossVectors(up, normal).normalize();
      t2.crossVectors(normal, t1);
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([x, y]) => {
        corner
          .copy(normal)
          .multiplyScalar(1.012)
          .addScaledVector(t1, x * BEACON_HALF)
          .addScaledVector(t2, y * BEACON_HALF);
        vertices.push(corner.x, corner.y, corner.z);
        uvs.push((x + 1) / 2, (y + 1) / 2);
        info.push(beaconPhase(i), i);
      });
      index.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    });
    const geometry = track(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("aBeacon", new THREE.Float32BufferAttribute(info, 2));
    geometry.setIndex(index);
    const beacons = new THREE.Mesh(
      geometry,
      track(
        glow({
          vertexShader: beaconVertex,
          fragmentShader: beaconFragment,
          side: THREE.DoubleSide,
          uniforms: { uTime, uPing: { value: beaconPing }, uIntro: uIntroFx },
        }),
      ),
    );
    beacons.frustumCulled = false;
    spinGroup.add(beacons);
  }

  /* ---- arcs between markets: eight tubes merged into one draw call ---- */
  {
    const vertices: number[] = [];
    const uvs: number[] = [];
    const info: number[] = [];
    const index: number[] = [];
    LINKS.forEach(([a, b], i) => {
      const points = arcPoints(MARKET_VECTORS[a], MARKET_VECTORS[b], ARC_STEPS).map(
        (point) => new THREE.Vector3(...point),
      );
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, 0.0027, 5, false);
      const base = vertices.length / 3;
      const tubePositions = tube.attributes.position.array;
      const tubeUvs = tube.attributes.uv.array;
      const { offset, speed } = arcTiming(i);
      for (let v = 0; v < tubePositions.length / 3; v++) {
        vertices.push(tubePositions[v * 3], tubePositions[v * 3 + 1], tubePositions[v * 3 + 2]);
        uvs.push(tubeUvs[v * 2], tubeUvs[v * 2 + 1]);
        info.push(offset, speed);
      }
      for (const vertex of tube.index!.array) index.push(base + vertex);
      tube.dispose();
    });
    const geometry = track(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("aArc", new THREE.Float32BufferAttribute(info, 2));
    geometry.setIndex(index);
    const arcs = new THREE.Mesh(
      geometry,
      track(
        glow({
          vertexShader: arcVertex,
          fragmentShader: arcFragment,
          uniforms: { uTime, uIntro: uIntroFx },
        }),
      ),
    );
    arcs.frustumCulled = false;
    spinGroup.add(arcs);
  }

  /* ---- orbit rings ---- */
  const orbits = ORBITS.map((def) => {
    const roll = new THREE.Group();
    const pitch = new THREE.Group();
    pitch.rotation.x = def.pitch;
    rig.add(roll);
    roll.add(pitch);

    const heads = [-1, -1, -1];
    pitch.add(
      new THREE.Mesh(
        track(new THREE.TorusGeometry(def.radius, 0.0032, 6, 360)),
        track(
          glow({
            vertexShader: lineVertex,
            fragmentShader: orbitFragment,
            uniforms: {
              uHeads: { value: heads },
              uDir: { value: Math.sign(def.speed) },
              uBase: { value: def.base },
              uIntro: uIntroLines,
            },
          }),
        ),
      ),
    );
    return { roll, heads };
  });

  /* ---- sparks: the nodes riding the rings, and drifting dust ---- */
  const sparkMaterial = track(
    glow({
      vertexShader: sparkVertex,
      fragmentShader: sparkFragment,
      uniforms: { uTime, uPxPerUnit, uIntro: uIntroFx },
    }),
  );

  const nodeCount = ORBITS.reduce((sum, orbit) => sum + orbit.nodes.length, 0);
  const nodePositions = new Float32Array(nodeCount * 3);
  const nodeSparks = new Float32Array(nodeCount * 3);
  {
    let n = 0;
    for (const orbit of ORBITS) {
      orbit.nodes.forEach((_, i) => nodeSparks.set([nodeSize(i), 1, 0], n++ * 3));
    }
  }
  const nodeGeometry = track(new THREE.BufferGeometry());
  const nodeAttribute = new THREE.BufferAttribute(nodePositions, 3);
  nodeGeometry.setAttribute("position", nodeAttribute);
  nodeGeometry.setAttribute("aSpark", new THREE.BufferAttribute(nodeSparks, 3));
  const nodes = new THREE.Points(nodeGeometry, sparkMaterial);
  nodes.frustumCulled = false;
  rig.add(nodes);

  const dustCloud = buildDust(240);
  const dustGeometry = track(new THREE.BufferGeometry());
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustCloud.position, 3));
  dustGeometry.setAttribute("aSpark", new THREE.BufferAttribute(dustCloud.spark, 3));
  const dust = new THREE.Points(dustGeometry, sparkMaterial);
  dust.frustumCulled = false;
  rig.add(dust);

  const point: Vec3 = [0, 0, 0];

  return {
    canvas: renderer.domElement,

    resize(width, height, ratio) {
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      uPxPerUnit.value = (height * ratio) / (2 * HALF_FOV_TAN);
    },

    render(frame: GlobeFrame) {
      uTime.value = frame.time;
      uIntroDots.value = frame.intro;
      uIntroLines.value = frame.lines;
      uIntroFx.value = frame.fx;

      spinGroup.rotation.y = frame.spin;
      tiltGroup.rotation.x = frame.tilt;
      rig.rotation.set(frame.parallaxX, frame.parallaxY, 0);
      rig.position.y = frame.offsetY;
      rig.scale.setScalar(frame.scale);

      for (let i = 0; i < 2; i++) {
        rippleOrigin[i].fromArray(frame.rippleOrigin[i]);
        rippleShape[i].fromArray(frame.ripple[i]);
      }
      for (let i = 0; i < beaconPing.length; i++) beaconPing[i] = frame.ping[i];

      let node = 0;
      orbits.forEach((orbit, i) => {
        const def = ORBITS[i];
        const state = frame.orbits[i];
        orbit.roll.rotation.z = state.roll;
        state.heads.forEach((head, j) => {
          orbit.heads[j] = head;
          orbitPoint(def.radius, def.pitch, state.roll, head, point);
          nodePositions.set(point, node++ * 3);
        });
      });
      nodeAttribute.needsUpdate = true;

      dust.rotation.set(frame.dustTip, frame.dustSpin, 0);
      renderer.render(scene, camera);
    },

    dispose() {
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

import * as THREE from 'three';
import { VehicleKey } from '../types';

const M = (c: number, rough = 0.5, metal = 0.1) => 
  new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal });

export function createBox(w: number, h: number, d: number, c: number, x = 0, y = 0, z = 0, rough = 0.5, metal = 0.1): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, rough, metal));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function createCylinder(rt: number, rb: number, h: number, seg: number, c: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), M(c));
  m.position.set(x, y, z);
  return m;
}

export function createLabelSprite(text: string, bgColor = '#0b5d34', width = 3.8, textColor = '#ffffff'): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  
  // Background pill / plaque
  ctx.fillStyle = bgColor;
  ctx.roundRect ? ctx.roundRect(8, 8, 496, 112, 24) : ctx.rect(8, 8, 496, 112);
  ctx.fill();
  
  // Border
  ctx.strokeStyle = '#f2c230';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Text
  ctx.fillStyle = textColor;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 68);

  const texture = new THREE.CanvasTexture(c);
  texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(width, width * 0.25, 1);
  return sprite;
}

export function createSpeechBubbleSprite(text: string, bgColor = '#ffffff', textColor = '#111827', width = 4.2): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext('2d')!;

  // White speech bubble body with golden amber border
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;

  if (ctx.roundRect) {
    ctx.roundRect(16, 16, 480, 100, 24);
  } else {
    ctx.rect(16, 16, 480, 100);
  }
  ctx.fill();
  ctx.stroke();

  // Speech bubble pointer tail at bottom center
  ctx.beginPath();
  ctx.moveTo(234, 114);
  ctx.lineTo(256, 148);
  ctx.lineTo(278, 114);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Dialogue Text
  ctx.fillStyle = textColor;
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(c);
  texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(width, width * 0.32, 1);
  return sprite;
}

export interface PersonGroup extends THREE.Group {
  aL: THREE.Group;
  aR: THREE.Group;
  lL: THREE.Group;
  lR: THREE.Group;
  umbrella?: THREE.Group;
  ph: number;
  walk?: number;
  t?: number;
  sx?: number;
  sz?: number;
  s?: THREE.Group;
  f?: THREE.Sprite;
  destStop?: string;
  originStop?: string;
  farePrice?: number;
  shirtColor?: number;
  hasUmbrella?: boolean;
}

export function createPerson(shirtCol: number, hasUmbrella = false): PersonGroup {
  const g = new THREE.Group() as PersonGroup;
  g.shirtColor = shirtCol;
  g.hasUmbrella = hasUmbrella;
  const skins = [0x8d5524, 0x6b4423, 0xc68642, 0x4a2f1b];
  const skin = skins[Math.floor(Math.random() * skins.length)];

  // Torso
  g.add(createBox(0.5, 0.7, 0.3, shirtCol, 0, 1.15, 0));

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), M(skin));
  head.position.y = 1.72;
  g.add(head);

  // Hair / Cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.25, 0.12, 10), M(0x222222));
  cap.position.y = 1.86;
  g.add(cap);

  // Limbs helper
  const limb = (x: number, y: number, w: number, l: number, col: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    pivot.add(createBox(w, l, w, col, 0, -l / 2, 0));
    g.add(pivot);
    return pivot;
  };

  g.aL = limb(-0.36, 1.47, 0.14, 0.6, skin);
  g.aR = limb(0.36, 1.47, 0.14, 0.6, skin);
  g.lL = limb(-0.13, 0.8, 0.18, 0.8, 0x2b3a55);
  g.lR = limb(0.13, 0.8, 0.18, 0.8, 0x2b3a55);
  g.ph = Math.random() * 6;

  // Weather-specific Umbrella accessory
  if (hasUmbrella) {
    const umb = new THREE.Group();
    const handle = createCylinder(0.02, 0.02, 1.4, 6, 0x222222, 0, 0.7, 0);
    umb.add(handle);
    const canopyCol = [0xe74c3c, 0xf1c40f, 0x2ecc71, 0x3498db, 0x9b59b6][Math.floor(Math.random() * 5)];
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.35, 12, 1, true), M(canopyCol, 0.3));
    canopy.position.y = 1.35;
    umb.add(canopy);
    umb.position.set(0.36, 1.2, 0.2);
    umb.rotation.z = -0.15;
    g.add(umb);
    g.umbrella = umb;
  }

  return g;
}

export function createPillionPassenger(shirtColor = 0x2b6cd6, hasUmbrella = false): PersonGroup {
  const p = createPerson(shirtColor, hasUmbrella);
  p.scale.set(0.82, 0.82, 0.82);
  p.position.set(0, 0.65, 0.65);
  // Straddling motorcycle pillion seat
  p.lL.rotation.x = -1.18;
  p.lR.rotation.x = -1.18;
  p.lL.rotation.z = -0.25;
  p.lR.rotation.z = 0.25;
  // Holding onto rider or grab bar
  p.aL.rotation.x = -1.0;
  p.aR.rotation.x = -1.0;
  return p;
}

export interface VehicleMeshGroup extends THREE.Group {
  len: number;
  headlights?: THREE.Group;
  taillights?: THREE.Group;
  headlightBeams?: THREE.Group;
  wipers?: THREE.Group;
  wiperAngles?: number[];
  typeKey?: VehicleKey;
  passengerHolder?: THREE.Group;
}

export function createHeadlightBeam(x: number, y: number, z: number, length = 15, spread = 2.4, color = 0xfffae6): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(0.12, spread, length, 12, 1, true);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -length / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

export function createVehicle(type: VehicleKey, col: number, isPlayer = false): VehicleMeshGroup {
  const g = new THREE.Group() as VehicleMeshGroup;
  g.typeKey = type;

  const wheel = (x: number, z: number, r: number, w = 0.34) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 16), M(0x181818, 0.8, 0.1));
    m.rotation.z = Math.PI / 2;
    m.position.set(x, r, z);
    g.add(m);
    // Hubcap
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, w + 0.02, 8), M(0xcccccc, 0.2, 0.8));
    hub.rotation.z = Math.PI / 2;
    hub.position.set(x, r, z);
    g.add(hub);
  };

  const headlightsGroup = new THREE.Group();
  const taillightsGroup = new THREE.Group();
  const headlightBeamsGroup = new THREE.Group();

  if (type === 'bike') {
    // Motorcycle frame
    g.add(createBox(0.35, 0.55, 2.1, col, 0, 0.75, 0, 0.4, 0.5));
    // Fuel tank
    g.add(createBox(0.4, 0.3, 0.8, col, 0, 1.1, -0.2, 0.2, 0.6));
    // Seat
    g.add(createBox(0.34, 0.15, 0.9, 0x111111, 0, 1.05, 0.4));
    // Fork & Handlebars
    g.add(createBox(0.1, 0.7, 0.1, 0x333333, 0, 1.2, -0.85));
    g.add(createBox(0.75, 0.08, 0.08, 0x222222, 0, 1.55, -0.85));
    // Exhaust pipe
    g.add(createCylinder(0.05, 0.06, 1.2, 8, 0xdddddd, 0.22, 0.4, 0.4));

    wheel(0, 0.9, 0.4, 0.18);
    wheel(0, -0.9, 0.4, 0.18);

    // Headlight
    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12), new THREE.MeshBasicMaterial({ color: 0xfff0aa }));
    hl.rotation.x = Math.PI / 2;
    hl.position.set(0, 1.35, -0.95);
    headlightsGroup.add(hl);

    // Forward headlight beam
    headlightBeamsGroup.add(createHeadlightBeam(0, 1.35, -1.0, 14, 2.0, 0xfff0aa));

    // Taillight
    const tl = createBox(0.15, 0.08, 0.05, 0xff2222, 0, 0.95, 0.95);
    taillightsGroup.add(tl);

    if (isPlayer) {
      // Okada Rider with helmet
      const rider = createPerson(0xf1c40f);
      rider.scale.set(0.85, 0.85, 0.85);
      rider.position.set(0, 0.65, 0.1);
      rider.lL.rotation.x = -1.2;
      rider.lR.rotation.x = -1.2;
      rider.aL.rotation.x = -1.1;
      rider.aR.rotation.x = -1.1;
      // Helmet
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), M(0xe67e22, 0.3, 0.2));
      helmet.position.y = 1.76;
      rider.add(helmet);
      g.add(rider);
    }
    g.len = 2.4;
  } else if (type === 'cab') {
    // Toyota Corolla E100 Sedan ("First Lady" / Abuja Cab) matching reference image
    const cabCol = col || 0x9ebd99; // Default to reference image sage/mint green

    // Custom Bronze 6-Spoke Sport Wheels
    const bronzeSportWheel = (x: number, z: number, r = 0.36, w = 0.30, isRight = false) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(x, r, z);

      // Low-profile dark performance tire
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, w, 24),
        M(0x161616, 0.85, 0.1)
      );
      tire.rotation.z = Math.PI / 2;
      wheelGroup.add(tire);

      // Metallic Bronze outer rim
      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.78, r * 0.78, w + 0.015, 20),
        new THREE.MeshStandardMaterial({ color: 0xc09255, roughness: 0.35, metalness: 0.65 })
      );
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      // Brake disc rotor & sporty red caliper
      const rotor = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.58, r * 0.58, 0.06, 16),
        new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.2, metalness: 0.85 })
      );
      rotor.rotation.z = Math.PI / 2;
      rotor.position.x = isRight ? -w * 0.2 : w * 0.2;
      wheelGroup.add(rotor);

      const caliper = createBox(0.06, 0.11, 0.13, 0xd63031, isRight ? -w * 0.25 : w * 0.25, r * 0.32, 0);
      wheelGroup.add(caliper);

      // 6 Bronze Sport Spokes
      const spokeGroup = new THREE.Group();
      spokeGroup.position.x = isRight ? w * 0.48 : -w * 0.48;

      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const spoke = new THREE.Mesh(
          new THREE.BoxGeometry(0.075, r * 0.70, 0.035),
          new THREE.MeshStandardMaterial({ color: 0xc09255, roughness: 0.35, metalness: 0.65 })
        );
        spoke.rotation.z = angle;
        spokeGroup.add(spoke);
      }

      // Center hub
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.22, r * 0.22, 0.05, 12),
        new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.8 })
      );
      hub.rotation.z = Math.PI / 2;
      spokeGroup.add(hub);

      wheelGroup.add(spokeGroup);
      g.add(wheelGroup);
    };

    // Stanced bronze wheels placement
    [-0.94, 0.94].forEach(x => {
      const isRight = x > 0;
      bronzeSportWheel(x, 1.35, 0.36, 0.30, isRight);
      bronzeSportWheel(x, -1.35, 0.36, 0.30, isRight);
    });

    // 1. Lower Body & Rocker Sills
    g.add(createBox(1.82, 0.46, 4.35, cabCol, 0, 0.48, 0, 0.35, 0.3));

    // 2. Black Side Rubbing Moulding Strips (from reference illustration)
    [-0.92, 0.92].forEach(x => {
      g.add(createBox(0.04, 0.06, 3.8, 0x1a1a1a, x, 0.68, 0));
    });

    // 3. Black Door Handles (Front & Rear Doors)
    [-0.93, 0.93].forEach(x => {
      // Front handle
      g.add(createBox(0.03, 0.06, 0.14, 0x111111, x, 0.78, -0.42));
      // Rear handle
      g.add(createBox(0.03, 0.06, 0.14, 0x111111, x, 0.78, 0.48));
      // Front fender amber side marker repeater (from image)
      g.add(createBox(0.03, 0.05, 0.09, 0xf39c12, x, 0.72, -1.25));
      // Black aerodynamic side mirror
      g.add(createBox(0.14, 0.12, 0.22, 0x111111, x * 1.04, 1.08, -0.75));
    });

    // 4. Sloping Aerodynamic Hood & Front Fenders
    const hood = createBox(1.76, 0.24, 1.35, cabCol, 0, 0.82, -1.35, 0.3, 0.35);
    hood.rotation.x = -0.05;
    g.add(hood);

    // Cowl & base of windshield in black
    g.add(createBox(1.68, 0.06, 0.22, 0x222222, 0, 0.96, -0.72));

    // 5. Front Fascia: Horizontal Grille & Dual Slats
    g.add(createBox(0.96, 0.13, 0.08, 0x151515, 0, 0.72, -2.18));
    // Center emblem badge
    g.add(createBox(0.12, 0.08, 0.10, 0xdddddd, 0, 0.72, -2.20));

    // 6. Wrap-around Headlights (Clear Main Beam + Amber Corner Indicators)
    [-0.64, 0.64].forEach(x => {
      // Clear main beam
      const hl = createBox(0.38, 0.15, 0.08, 0xf5f7fa, x, 0.72, -2.18, 0.1, 0.9);
      headlightsGroup.add(hl);
      // Forward headlight beam projection
      headlightBeamsGroup.add(createHeadlightBeam(x, 0.72, -2.25, 16, 2.5, 0xfffae6));
    });

    [-0.86, 0.86].forEach(x => {
      // Amber wrap-around corner signal (from illustration)
      const cornerLight = createBox(0.12, 0.15, 0.14, 0xf39c12, x, 0.72, -2.13, 0.2, 0.8);
      headlightsGroup.add(cornerLight);
    });

    // 7. Front Bumper with Lower Air Intake & Amber Bumper Signals
    g.add(createBox(1.82, 0.32, 0.34, cabCol, 0, 0.44, -2.15, 0.35, 0.3));
    // Center lower black air intake cutout
    g.add(createBox(0.86, 0.14, 0.36, 0x111111, 0, 0.36, -2.16));
    // Horizontal amber turn signals in bumper (from illustration)
    [-0.62, 0.62].forEach(x => {
      g.add(createBox(0.32, 0.07, 0.06, 0xf39c12, x, 0.44, -2.32));
    });
    // Lower front chin spoiler
    g.add(createBox(1.80, 0.06, 0.28, 0x111111, 0, 0.24, -2.17));

    // 8. Cabin Greenhouse & Windows
    // Main cabin box
    g.add(createBox(1.58, 0.58, 2.30, cabCol, 0, 1.18, 0.06, 0.35, 0.3));
    // Dark smoke-tinted gray glass (matching illustration)
    g.add(createBox(1.60, 0.52, 2.22, 0x47515b, 0, 1.20, 0.06, 0.15, 0.85));
    // Black A-pillar and B-pillar trim
    [-0.80, 0.80].forEach(x => {
      // B-pillar separator
      g.add(createBox(0.04, 0.54, 0.16, 0x1a1a1a, x, 1.20, 0.06));
    });
    // Roof panel in sage green
    g.add(createBox(1.54, 0.06, 1.70, cabCol, 0, 1.48, 0.08, 0.35, 0.3));

    // 9. Rear Notchback Sedan Trunk
    g.add(createBox(1.76, 0.28, 0.98, cabCol, 0, 0.85, 1.66, 0.35, 0.3));

    // 10. Rear Taillights (90s Corolla Wrap-around Clusters)
    [-0.66, 0.66].forEach(x => {
      // Red upper brake/running light
      const tl = createBox(0.44, 0.10, 0.08, 0xd63031, x, 0.86, 2.16);
      taillightsGroup.add(tl);
      // Amber lower indicator band
      const amberBand = createBox(0.44, 0.08, 0.08, 0xf39c12, x, 0.77, 2.16);
      taillightsGroup.add(amberBand);
    });

    // 11. Rear Bumper & Sport Exhaust Tip
    g.add(createBox(1.82, 0.34, 0.32, cabCol, 0, 0.46, 2.16, 0.35, 0.3));
    // Chrome sport exhaust tip on left side
    g.add(createCylinder(0.05, 0.05, 0.32, 10, 0xdddddd, -0.62, 0.26, 2.30));

    // 12. Sleek Low-Profile Taxi Roof Sign (Maintains Abuja Cab Identity)
    const taxiSignBase = createBox(0.50, 0.04, 0.22, 0x222222, 0, 1.50, 0.08);
    g.add(taxiSignBase);
    const taxiSignPod = createBox(0.56, 0.16, 0.26, 0xf2c230, 0, 1.60, 0.08);
    g.add(taxiSignPod);

    // 13. Windshield Wipers
    const wipers = new THREE.Group();
    [-0.35, 0.35].forEach(x => {
      const wp = createBox(0.04, 0.38, 0.02, 0x111111, x, 1.25, -0.82);
      wp.rotation.z = 0.2;
      wipers.add(wp);
    });
    g.wipers = wipers;
    g.add(wipers);

    g.len = 4.5;
  } else {
    // Danfo / Coaster Bus
    // Main Body
    g.add(createBox(2.55, 2.1, 7.6, col, 0, 1.55, 0, 0.4, 0.3));
    // Window strip
    g.add(createBox(2.6, 0.75, 6.7, 0x90caf9, 0, 2.05, 0, 0.1, 0.8));
    // Green/White Danfo waistline stripe
    g.add(createBox(2.58, 0.22, 7.62, 0xffffff, 0, 1.1, 0));
    g.add(createBox(2.59, 0.12, 7.63, 0x0f9d58, 0, 0.95, 0));
    // Roof luggage rack
    g.add(createBox(2.1, 0.15, 4.5, 0x333333, 0, 2.7, 0.5));
    // Heavy front bumper & grille
    g.add(createBox(2.56, 0.35, 0.25, 0x111111, 0, 0.75, -3.85));

    [-1.25, 1.25].forEach(x => {
      wheel(x, 2.4, 0.52, 0.4);
      wheel(x, -2.4, 0.52, 0.4);
    });

    // Twin large bus headlights
    [-0.95, 0.95].forEach(x => {
      const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 14), new THREE.MeshBasicMaterial({ color: 0xfff5cc }));
      hl.rotation.x = Math.PI / 2;
      hl.position.set(x, 1.0, -3.85);
      headlightsGroup.add(hl);
      // Large bus forward beams
      headlightBeamsGroup.add(createHeadlightBeam(x, 1.0, -3.95, 18, 3.0, 0xfff5cc));
    });

    // Bus Taillights
    [-1.0, 1.0].forEach(x => {
      const tl = createBox(0.25, 0.4, 0.08, 0xdd1111, x, 1.2, 3.82);
      taillightsGroup.add(tl);
    });

    // Dual big wipers
    const wipers = new THREE.Group();
    [-0.55, 0.55].forEach(x => {
      const wp = createBox(0.06, 0.55, 0.03, 0x111111, x, 1.9, -3.82);
      wp.rotation.z = 0.25;
      wipers.add(wp);
    });
    g.wipers = wipers;
    g.add(wipers);

    g.len = 7.8;
  }

  g.headlights = headlightsGroup;
  g.taillights = taillightsGroup;
  g.headlightBeams = headlightBeamsGroup;
  g.add(headlightsGroup);
  g.add(taillightsGroup);
  g.add(headlightBeamsGroup);

  if (isPlayer) {
    const passengerHolder = new THREE.Group();
    g.add(passengerHolder);
    g.passengerHolder = passengerHolder;
  }

  return g;
}

export function createPuddleMesh(radius = 1.4): THREE.Mesh {
  const geo = new THREE.CircleGeometry(radius, 16);
  // Glossy reflective wet asphalt puddle
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1b2838,
    roughness: 0.08,
    metalness: 0.85,
    transparent: true,
    opacity: 0.88,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.04;
  return mesh;
}

export function createStreetlight(side: -1 | 1): THREE.Group {
  const g = new THREE.Group();
  const poleHeight = 6.2;
  // Pole
  g.add(createCylinder(0.1, 0.16, poleHeight, 8, 0x3e444c, side * 5.6, poleHeight / 2, 0));
  // Overhanging curved arm
  g.add(createBox(1.4, 0.1, 0.1, 0x3e444c, side * 5.0, poleHeight + 0.1, 0));
  // Lamp fixture
  const fixture = createBox(0.6, 0.15, 0.35, 0x22262a, side * 4.4, poleHeight, 0);
  g.add(fixture);
  // Glowing sodium lamp bulb
  const bulb = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.08, 0.28),
    new THREE.MeshBasicMaterial({ color: 0xffd166 })
  );
  bulb.position.set(side * 4.4, poleHeight - 0.08, 0);
  bulb.name = 'bulb';
  g.add(bulb);

  // Volumetric downward light cone from lamp fixture to road
  const coneGeo = new THREE.CylinderGeometry(0.3, 2.8, poleHeight - 0.1, 14, 1, true);
  coneGeo.translate(0, -(poleHeight - 0.1) / 2, 0);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffd166,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const beam = new THREE.Mesh(coneGeo, coneMat);
  beam.position.set(side * 4.4, poleHeight - 0.1, 0);
  beam.name = 'beam';
  g.add(beam);

  // Ground warm light pool disc on road shoulder
  const groundGeo = new THREE.CircleGeometry(2.6, 16);
  const groundMat = new THREE.MeshBasicMaterial({
    color: 0xffbe3b,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const groundPool = new THREE.Mesh(groundGeo, groundMat);
  groundPool.rotation.x = -Math.PI / 2;
  groundPool.position.set(side * 4.4, 0.05, 0);
  groundPool.name = 'groundPool';
  g.add(groundPool);

  return g;
}

export function createHawkerStand(type: 'suya' | 'water' | 'gala'): THREE.Group {
  const g = new THREE.Group();

  if (type === 'suya') {
    // Suya grill spot with smoking red charcoal embers
    g.add(createBox(1.4, 0.8, 0.8, 0x4a4a4a, 0, 0.4, 0));
    // Glowing red charcoal
    const ember = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.1, 0.65),
      new THREE.MeshBasicMaterial({ color: 0xff3b00 })
    );
    ember.position.set(0, 0.85, 0);
    g.add(ember);
    // Skewers
    for (let i = -0.4; i <= 0.4; i += 0.2) {
      g.add(createBox(0.04, 0.05, 0.5, 0x8b4513, i, 0.92, 0));
    }
    // Chef / Mai Suya
    const chef = createPerson(0xffffff);
    chef.position.set(0, 0, 0.7);
    g.add(chef);

    const sign = createLabelSprite('🔥 MAI SUYA · FRESH!', '#8b0000', 3.2, '#fff');
    sign.position.set(0, 2.4, 0);
    g.add(sign);
  } else if (type === 'water') {
    // "Pure Water" hawker with plastic bowl on head
    const hawker = createPerson(0x27ae60);
    hawker.position.set(0, 0, 0);
    // Cold water basin on head
    const basin = createCylinder(0.42, 0.32, 0.25, 10, 0x3498db, 0, 2.05, 0);
    hawker.add(basin);
    // Water sachets inside
    hawker.add(createBox(0.5, 0.15, 0.5, 0xecf0f1, 0, 2.18, 0));
    g.add(hawker);

    const sign = createLabelSprite('❄️ PURE WATER · ₦100', '#1b6ca8', 3.0, '#fff');
    sign.position.set(0, 2.6, 0);
    g.add(sign);
  } else {
    // Gala Sausage & soft drink hawker
    const hawker = createPerson(0xe67e22);
    hawker.position.set(0, 0, 0);
    // Snack tray
    hawker.add(createBox(0.7, 0.15, 0.45, 0xd35400, 0, 1.25, 0.35));
    g.add(hawker);

    const sign = createLabelSprite('🌭 GALA & COLD DRINKS', '#d35400', 3.2, '#fff');
    sign.position.set(0, 2.6, 0);
    g.add(sign);
  }

  return g;
}

export function createAbujaCityGate(): THREE.Group {
  const g = new THREE.Group();
  // Grand monument archway crossing the 3 lanes (span = 14m, height = 9m)
  // Left Pillar
  g.add(createBox(2.2, 9.0, 2.2, 0xecf0f1, -7.5, 4.5, 0));
  // Right Pillar
  g.add(createBox(2.2, 9.0, 2.2, 0xecf0f1, 7.5, 4.5, 0));
  // Cross beam
  g.add(createBox(17.2, 2.2, 2.4, 0x27ae60, 0, 8.8, 0));
  // Nigerian Green-White-Green vertical flags on pillars
  [-7.5, 7.5].forEach(x => {
    g.add(createBox(0.6, 6.0, 0.1, 0x008751, x - 0.6, 4.5, 1.15));
    g.add(createBox(0.6, 6.0, 0.1, 0xffffff, x, 4.5, 1.15));
    g.add(createBox(0.6, 6.0, 0.1, 0x008751, x + 0.6, 4.5, 1.15));
  });

  // Top Crest & Arch sign
  const gateSign = createLabelSprite('★ FEDERAL CAPITAL TERRITORY · WELCOME TO ABUJA ★', '#004d26', 11.5, '#f1c40f');
  gateSign.position.set(0, 9.0, 1.25);
  g.add(gateSign);

  return g;
}

export function createOverheadHighwaySign(destText: string): THREE.Group {
  const g = new THREE.Group();
  // Gantry frame spanning lanes
  g.add(createCylinder(0.12, 0.14, 7.2, 8, 0x555555, -6.8, 3.6, 0));
  g.add(createCylinder(0.12, 0.14, 7.2, 8, 0x555555, 6.8, 3.6, 0));
  g.add(createBox(13.8, 0.2, 0.2, 0x555555, 0, 7.0, 0));

  const sign = createLabelSprite(destText, '#0f6b3e', 9.0, '#ffffff');
  sign.position.set(0, 6.5, 0);
  g.add(sign);
  return g;
}

export function createBillboard(text: string, sub: string, brandColor: string, side: -1 | 1): THREE.Group {
  const g = new THREE.Group();
  const poleX = side * 11.0;
  // Steel pole
  g.add(createCylinder(0.25, 0.3, 8.0, 8, 0x444444, poleX, 4.0, 0));

  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = brandColor;
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 256, 100);
  ctx.font = '26px sans-serif';
  ctx.fillStyle = '#ffecb3';
  ctx.fillText(sub, 256, 170);

  const tex = new THREE.CanvasTexture(c);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.2, 0.3), [
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
    new THREE.MeshBasicMaterial({ map: tex }),
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
  ]);
  mesh.position.set(poleX, 7.8, 0);
  mesh.rotation.y = side === 1 ? -0.2 : 0.2;
  g.add(mesh);

  return g;
}

// --- REALISTIC ABUJA BUILDINGS SYSTEM ---

const textureCache: Record<string, THREE.CanvasTexture> = {};

export function getFacadeTexture(type: 'glass-tower' | 'sandstone-plaza' | 'granite-office'): THREE.CanvasTexture {
  if (textureCache[type]) return textureCache[type];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (type === 'glass-tower') {
    // Deep blue reflective glass with aluminum grid and warm office lights
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(0, 0, 512, 512);

    const cols = 8;
    const rows = 16;
    const cw = 512 / cols;
    const rh = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Window pane
        const isLit = (r * 7 + c * 13) % 5 === 0 || (r * 3 + c * 11) % 7 === 0;
        ctx.fillStyle = isLit ? '#ffeaa7' : (r % 2 === 0 ? '#34495e' : '#2c3e50');
        ctx.fillRect(c * cw + 6, r * rh + 5, cw - 12, rh - 10);

        // Mullion border
        ctx.strokeStyle = '#485460';
        ctx.lineWidth = 2;
        ctx.strokeRect(c * cw + 6, r * rh + 5, cw - 12, rh - 10);
      }
    }
  } else if (type === 'sandstone-plaza') {
    // Abuja warm sandstone with horizontal window ribbon strips
    ctx.fillStyle = '#d5c39e';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 12;
    const rh = 512 / rows;
    for (let r = 0; r < rows; r++) {
      // Horizontal concrete spandrel panel
      ctx.fillStyle = '#bfa982';
      ctx.fillRect(0, r * rh + rh * 0.55, 512, rh * 0.45);

      // Window strip
      for (let c = 0; c < 10; c++) {
        const cw = 512 / 10;
        const isLit = (r * 5 + c * 9) % 4 === 0;
        ctx.fillStyle = isLit ? '#fff3cd' : '#2b3a4a';
        ctx.fillRect(c * cw + 3, r * rh + 4, cw - 6, rh * 0.55 - 4);
        ctx.strokeStyle = '#8d7853';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(c * cw + 3, r * rh + 4, cw - 6, rh * 0.55 - 4);
      }
    }
  } else {
    // Modern granite corporate tower with vertical louvers and reflective windows
    ctx.fillStyle = '#3a4049';
    ctx.fillRect(0, 0, 512, 512);

    const cols = 6;
    const rows = 14;
    const cw = 512 / cols;
    const rh = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isLit = (r * 11 + c * 7) % 3 === 0;
        ctx.fillStyle = isLit ? '#f9f1d0' : '#1e242c';
        ctx.fillRect(c * cw + 8, r * rh + 6, cw - 16, rh - 12);
        ctx.strokeStyle = '#57606f';
        ctx.lineWidth = 2;
        ctx.strokeRect(c * cw + 8, r * rh + 6, cw - 16, rh - 12);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache[type] = texture;
  return texture;
}

const BUILDING_NAMES = [
  'NNPC TOWERS',
  'CENTRAL BANK PLAZA',
  'ZENITH CORPORATE',
  'MAITAMA BUSINESS HUB',
  'TRANS-NIGERIA TOWERS',
  'FEDERAL SECRETARIAT',
  'FIRST CAPITAL SUITES',
  'ABUJA WORLD TRADE',
];

export function createRealisticBuilding(side: -1 | 1, variantIndex: number): THREE.Group {
  const g = new THREE.Group();
  const v = variantIndex % 4;

  const bldgName = BUILDING_NAMES[Math.floor(Math.random() * BUILDING_NAMES.length)];
  const facingSignOffset = side === 1 ? -1 : 1;

  if (v === 0) {
    // 1. Modern Glass Curtain Skyscraper (NNPC / Corporate High-Rise)
    const bw = 8.5;
    const bh = 22.0;
    const bd = 16.0;
    const x = side * (11.0 + bw / 2);

    const tex = getFacadeTexture('glass-tower');
    tex.repeat.set(2, 4);

    const towerMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.25,
      metalness: 0.65,
    });
    const tower = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), towerMat);
    tower.position.set(x, bh / 2, 0);
    g.add(tower);

    // Ground Floor Grand Entrance Lobby with Pillars & Canopy
    const lobby = createBox(bw + 0.4, 3.8, bd + 0.4, 0x1f2429, x, 1.9, 0, 0.4, 0.5);
    g.add(lobby);

    // Entrance Canopy extending toward highway
    const canopyX = x - facingSignOffset * (bw / 2 + 0.8);
    g.add(createBox(2.2, 0.2, 4.5, 0x333940, canopyX, 3.4, 0));
    // Canopy Support Pillars
    g.add(createCylinder(0.08, 0.08, 3.4, 8, 0x718096, canopyX - facingSignOffset * 0.9, 1.7, -1.8));
    g.add(createCylinder(0.08, 0.08, 3.4, 8, 0x718096, canopyX - facingSignOffset * 0.9, 1.7, 1.8));

    // Illuminated Corporate Sign on Canopy
    const sign = createLabelSprite(bldgName, '#0d2238', 4.2, '#f1c40f');
    sign.position.set(canopyX, 4.1, 0);
    g.add(sign);

    // Rooftop Mechanical Penthouse & Parapet
    g.add(createBox(bw - 1.2, 2.5, bd - 2.0, 0x2d3748, x, bh + 1.25, 0));
    // Rooftop AC Chillers
    [-1.5, 1.5].forEach(oz => {
      g.add(createBox(1.6, 1.2, 1.6, 0x4a5568, x - 1.0, bh + 0.6, oz));
      g.add(createCylinder(0.5, 0.5, 0.1, 10, 0x1a202c, x - 1.0, bh + 1.25, oz));
    });

    // Rooftop Telecommunications Antenna Spire with Aviation Beacon
    const mastHeight = 6.5;
    g.add(createCylinder(0.06, 0.14, mastHeight, 8, 0x718096, x + 1.2, bh + mastHeight / 2 + 2.5, 0));
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    beacon.position.set(x + 1.2, bh + mastHeight + 2.5, 0);
    g.add(beacon);

  } else if (v === 1) {
    // 2. Abuja Sandstone Plaza (Central Bank / Modern Stepped Complex)
    const bw = 9.5;
    const bh = 16.5;
    const bd = 16.0;
    const x = side * (11.0 + bw / 2);

    const tex = getFacadeTexture('sandstone-plaza');
    tex.repeat.set(2, 3);

    const mainMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.6,
      metalness: 0.2,
    });
    const mainBlock = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mainMat);
    mainBlock.position.set(x, bh / 2, 0);
    g.add(mainBlock);

    // Upper Tier Architectural Setback
    const upperW = bw - 2.2;
    const upperH = 4.2;
    const upperD = bd - 3.0;
    const upperBlock = new THREE.Mesh(new THREE.BoxGeometry(upperW, upperH, upperD), mainMat);
    upperBlock.position.set(x, bh + upperH / 2, 0);
    g.add(upperBlock);

    // Vertical Concrete Architectural Fins / Sun Louvers
    [-5, -1.8, 1.8, 5].forEach(oz => {
      const fin = createBox(0.2, bh, 0.6, 0xbfa982, x - facingSignOffset * (bw / 2 + 0.1), bh / 2, oz);
      g.add(fin);
    });

    // Ground Floor Entrance Portico
    const porticoX = x - facingSignOffset * (bw / 2 + 0.9);
    g.add(createBox(2.6, 0.35, 5.2, 0xa38f6b, porticoX, 3.8, 0));
    const sign = createLabelSprite(bldgName, '#3e2723', 4.4, '#ffffff');
    sign.position.set(porticoX, 4.6, 0);
    g.add(sign);

    // Rooftop Water Storage Tanks
    [-1.2, 1.2].forEach(oz => {
      const tank = createCylinder(0.85, 0.85, 1.6, 12, 0x4a6572, x, bh + upperH + 0.8, oz);
      g.add(tank);
    });

  } else if (v === 2) {
    // 3. Dark Granite Financial Center (Contemporary Corporate Hub)
    const bw = 8.0;
    const bh = 19.5;
    const bd = 16.0;
    const x = side * (11.0 + bw / 2);

    const tex = getFacadeTexture('granite-office');
    tex.repeat.set(2, 3.5);

    const graniteMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.4,
      metalness: 0.45,
    });
    const tower = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), graniteMat);
    tower.position.set(x, bh / 2, 0);
    g.add(tower);

    // Prominent Vertical Glass Corner Shaft
    const shaftX = x - facingSignOffset * (bw / 2 - 0.6);
    const glassShaft = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, bh + 1.5, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x22a6b3, roughness: 0.15, metalness: 0.85 })
    );
    glassShaft.position.set(shaftX, (bh + 1.5) / 2, 0);
    g.add(glassShaft);

    // Glowing Sign Board on Upper Tower Face
    const topSign = createLabelSprite(bldgName, '#004d40', 4.0, '#48dbfb');
    topSign.position.set(shaftX - facingSignOffset * 0.4, bh - 1.5, 0);
    g.add(topSign);

    // Rooftop Communications Satellite Dish
    const dishMast = createCylinder(0.08, 0.08, 2.2, 8, 0x555555, x + 1.0, bh + 1.1, 1.5);
    g.add(dishMast);
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.4, 12, 1, true), M(0xcccccc, 0.4));
    dish.rotation.x = Math.PI / 4;
    dish.position.set(x + 1.0, bh + 2.2, 1.5);
    g.add(dish);

  } else {
    // 4. Federal Secretariat / Ministry Complex (Modernist Geometric Civic)
    const bw = 10.0;
    const bh = 14.0;
    const bd = 16.0;
    const x = side * (11.0 + bw / 2);

    // Terracotta and white concrete geometry
    g.add(createBox(bw, bh, bd, 0xe0d6c3, x, bh / 2, 0, 0.6, 0.1));

    // Recessed dark window rows
    for (let floor = 2.5; floor < bh - 1; floor += 2.8) {
      g.add(createBox(0.15, 1.4, bd - 1.5, 0x1e272e, x - facingSignOffset * (bw / 2 + 0.05), floor, 0));
    }

    // Federal Green-White-Green Banner Accent
    [-2.2, 2.2].forEach(oz => {
      g.add(createBox(0.2, bh * 0.6, 0.4, 0x008751, x - facingSignOffset * (bw / 2 + 0.1), bh * 0.5, oz - 0.4));
      g.add(createBox(0.2, bh * 0.6, 0.4, 0xffffff, x - facingSignOffset * (bw / 2 + 0.1), bh * 0.5, oz));
      g.add(createBox(0.2, bh * 0.6, 0.4, 0x008751, x - facingSignOffset * (bw / 2 + 0.1), bh * 0.5, oz + 0.4));
    });

    // Grand Entrance Arch
    const sign = createLabelSprite(bldgName, '#004d26', 4.4, '#ffffff');
    sign.position.set(x - facingSignOffset * (bw / 2 + 0.8), 4.2, 0);
    g.add(sign);

    // Rooftop Penthouse & AC Chiller
    g.add(createBox(bw - 2.5, 2.0, bd - 3.0, 0x8a929a, x, bh + 1.0, 0));
  }

  return g;
}

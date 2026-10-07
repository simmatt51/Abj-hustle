import * as THREE from 'three';
import { sound } from '../audio';
import { HawkerItem, OnboardPassenger, PassengerSpeech, PuddleItem, TimeOfDayInfo, VehicleConfig, VehicleKey, WeatherKey, WeatherPreset } from '../types';
import { WEATHER_PRESETS, WEATHER_ORDER } from '../weatherData';
import {
  createAbujaCityGate,
  createBillboard,
  createBox,
  createHawkerStand,
  createLabelSprite,
  createOverheadHighwaySign,
  createPerson,
  createPillionPassenger,
  createPuddleMesh,
  createRealisticBuilding,
  createSpeechBubbleSprite,
  createStreetlight,
  createVehicle,
  PersonGroup,
  VehicleMeshGroup,
} from './threeAssets';

export const VEHICLE_CONFIGS: Record<VehicleKey, VehicleConfig> = {
  bike: {
    name: 'Okada',
    desc: 'Rapid express motorbike · 1 passenger · agile dodge',
    max: 36,
    cap: 1,
    fare: 250,
    col: 0xe65100,
    icon: '🏍️',
    handling: 12,
    acceleration: 1.4,
  },
  cab: {
    name: 'Corolla Cab (E100)',
    desc: 'Sage green Corolla sedan · 3 passengers · stanced bronze wheels',
    max: 29,
    cap: 3,
    fare: 450,
    col: 0x9ebd99,
    icon: '🚕',
    handling: 9.5,
    acceleration: 1.1,
  },
  bus: {
    name: 'Danfo Bus',
    desc: 'Yellow coaster bus · 8 passengers · massive rush hour fare',
    max: 23,
    cap: 8,
    fare: 200,
    col: 0xfbc02d,
    icon: '🚌',
    handling: 6.5,
    acceleration: 0.75,
  },
};

const HIGHWAY_EXITS = [
  'EXIT 1 · NYANYA / MARARABA',
  'EXIT 2 · ASO DRIVE / MAITAMA',
  'EXIT 3 · WUSE II / AHMADU BELLO WAY',
  'EXIT 4 · CENTRAL BUSINESS DISTRICT / GARKI',
  'EXIT 5 · JABI LAKE / UTAKO MARKET',
  'EXIT 6 · GWARINPA / KUBWA EXPRESS',
];

const BILLBOARD_ADS = [
  { text: 'AIRTEL 5G SPEED', sub: 'The Smartphone Network in Abuja', col: '#c62828' },
  { text: 'PEAK MILK NIGERIA', sub: 'Rich & Creamy · It\'s In You!', col: '#1565c0' },
  { text: 'INDOMIE INSTANT NOODLES', sub: 'Delicious taste · Nigeria\'s No.1', col: '#d84315' },
  { text: 'VISIT ABUJA CARNIVAL', sub: 'Culture, Heritage & Unity · FCT', col: '#2e7d32' },
  { text: 'DANGOTE CEMENT', sub: 'Building Nigeria Strong Since 1981', col: '#00695c' },
];

export interface EngineCallbacks {
  onMoneyChange: (money: number) => void;
  onLivesChange: (lives: number) => void;
  onRidersChange: (riders: number, cap: number) => void;
  onPassengersChange: (passengers: OnboardPassenger[], cap: number) => void;
  onSpeedChange: (speed: number) => void;
  onDistChange: (dist: number) => void;
  onWeatherChange: (weather: WeatherPreset) => void;
  onTimeChange?: (timeInfo: TimeOfDayInfo) => void;
  onHeadlightsChange?: (headlightsOn: boolean) => void;
  onPassengerSpeech?: (speech: PassengerSpeech) => void;
  onToast: (msg: string) => void;
  onGameOver: (stats: { money: number; dist: number; passengers: number; puddles: number; hawkers: number }) => void;
}

interface DayLightKeyframe {
  hour: number;
  skyColor: number;
  fogColor: number;
  sunColor: number;
  sunIntensity: number;
  ambColor: number;
  ambIntensity: number;
}

const DAY_LIGHT_KEYFRAMES: DayLightKeyframe[] = [
  { hour: 0.0,  skyColor: 0x070b16, fogColor: 0x090e1c, sunColor: 0x3d5a80, sunIntensity: 0.35, ambColor: 0x141b2d, ambIntensity: 0.35 },
  { hour: 4.5,  skyColor: 0x101428, fogColor: 0x141830, sunColor: 0x50577a, sunIntensity: 0.40, ambColor: 0x1c2338, ambIntensity: 0.40 },
  { hour: 6.2,  skyColor: 0xe07a5f, fogColor: 0xea907a, sunColor: 0xffaa5e, sunIntensity: 0.95, ambColor: 0xb87355, ambIntensity: 0.75 },
  { hour: 8.5,  skyColor: 0x64b5f6, fogColor: 0x90caf9, sunColor: 0xfff3b0, sunIntensity: 1.40, ambColor: 0xcfe2f3, ambIntensity: 1.05 },
  { hour: 12.5, skyColor: 0x3d84d6, fogColor: 0x76a7e0, sunColor: 0xfffae6, sunIntensity: 1.70, ambColor: 0xffffff, ambIntensity: 1.25 },
  { hour: 16.5, skyColor: 0xf4a261, fogColor: 0xdeb06c, sunColor: 0xffba08, sunIntensity: 1.45, ambColor: 0xf5d491, ambIntensity: 1.10 },
  { hour: 18.5, skyColor: 0xc1440e, fogColor: 0xb53f1f, sunColor: 0xff5400, sunIntensity: 0.95, ambColor: 0x9e2a2b, ambIntensity: 0.70 },
  { hour: 19.8, skyColor: 0x2b1e4a, fogColor: 0x23183d, sunColor: 0x5e4875, sunIntensity: 0.45, ambColor: 0x33254d, ambIntensity: 0.48 },
  { hour: 21.5, skyColor: 0x0c1020, fogColor: 0x101526, sunColor: 0x3d5a80, sunIntensity: 0.35, ambColor: 0x162035, ambIntensity: 0.38 },
  { hour: 24.0, skyColor: 0x070b16, fogColor: 0x090e1c, sunColor: 0x3d5a80, sunIntensity: 0.35, ambColor: 0x141b2d, ambIntensity: 0.35 },
];

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private hemiLight!: THREE.HemisphereLight;
  private sunLight!: THREE.DirectionalLight;
  private lightningLight!: THREE.PointLight;
  private sunDisc!: THREE.Mesh;
  private moonDisc!: THREE.Mesh;
  private ground!: THREE.Mesh;
  private roadMesh!: THREE.Mesh;

  // Day-Night progression & lighting
  private timeOfDayHours: number = 15.5; // Starts at 3:30 PM (afternoon towards sunset)
  private dayCycleSpeed: number = 0.08; // 1s = 0.08h -> full 24h cycle ~5 mins
  private isDayCycleActive: boolean = true;
  private isDarkTime: boolean = false;
  private playerHeadlightsManualOverride: boolean = false;
  private timeEmitTimer: number = 0;

  // Particle systems
  private rainParticles!: THREE.Points;
  private dustParticles!: THREE.Points;
  private splashParticles: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[] = [];
  private exhaustParticles: { mesh: THREE.Mesh; vy: number; vz: number; life: number }[] = [];

  // Road segments
  private segs: THREE.Group[] = [];
  private readonly NS = 16;
  private readonly SL = 20;
  private readonly LX = [-3.4, 0, 3.4];

  // Game state
  private player: VehicleMeshGroup | null = null;
  private vehicleKey: VehicleKey = 'cab';
  private vehicleCfg: VehicleConfig = VEHICLE_CONFIGS.cab;
  private state: 'menu' | 'play' | 'over' = 'menu';
  private lane: number = 1;
  private speed: number = 0;
  private money: number = 0;
  private lives: number = 3;
  private dist: number = 0;
  private riders: number = 0;
  private invulnerability: number = 0;
  private trafficTimer: number = 1.0;
  private nextStopDist: number = 100;
  private nextCityGateDist: number = 800;
  private nextGantryDist: number = 300;
  private nextBillboardDist: number = 150;
  private nextHawkerDist: number = 80;
  private nextPuddleDist: number = 40;
  private boardTimer: number = 0;
  private gameTime: number = 0;
  private shakeAmount: number = 0;
  private isBraking: boolean = false;
  private headLightsOn: boolean = true;
  private wipersActive: boolean = false;
  private wiperAngle: number = 0;
  private wiperDir: number = 1;
  private cameraView: 'chase' | 'hood' = 'chase';

  // Stats
  private totalPassengersServed: number = 0;
  private puddlesSplashed: number = 0;
  private hawkersGreeted: number = 0;

  // Weather state & transitions
  private currentWeatherKey: WeatherKey = 'sunny';
  private targetWeatherKey: WeatherKey = 'sunny';
  private weatherTransitionProgress: number = 1.0;
  private autoCycleWeather: boolean = true;
  private weatherCycleTimer: number = 0;
  private readonly WEATHER_CYCLE_DURATION = 40; // seconds per weather phase
  private lightningTimer: number = 0;
  private lightningFlashDuration: number = 0;

  // Scene entities
  private busStops: {
    group: THREE.Group;
    ppl: PersonGroup[];
    name: string;
    fare: number;
    alit: boolean;
    missed: boolean;
    notified?: boolean;
    missedDrop?: boolean;
  }[] = [];
  private passengersOnboard: OnboardPassenger[] = [];
  private stopSequenceIndex = 0;
  private traffic: { group: VehicleMeshGroup; speed: number; lane: number; changingLane?: number; targetX?: number }[] = [];
  private walkers: PersonGroup[] = [];
  private puddles: PuddleItem[] = [];
  private hawkers: HawkerItem[] = [];
  private cityGates: THREE.Group[] = [];
  private gantries: THREE.Group[] = [];
  private billboards: THREE.Group[] = [];
  private streetlights: THREE.Group[] = [];
  private activeSpeechBubbleSprite: THREE.Sprite | null = null;
  private speechBubbleTimer: number = 0;

  private animFrameId: number | null = null;
  private lastTime: number = performance.now();
  private callbacks: EngineCallbacks;
  private isGamePaused: boolean = false;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.initThree();
    this.initWorld();
    this.initParticles();
    this.callbacks.onWeatherChange(WEATHER_PRESETS.sunny);
  }

  private initThree() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.shadowMap.enabled = false; // lightweight high fps

    this.scene = new THREE.Scene();
    const initW = WEATHER_PRESETS.sunny;
    this.scene.background = new THREE.Color(initW.skyColor);
    this.scene.fog = new THREE.Fog(initW.fogColor, initW.fogNear, initW.fogFar);

    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 500);

    // Lights
    this.hemiLight = new THREE.HemisphereLight(initW.ambientColor, 0x4a5d3f, initW.ambientIntensity);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(initW.sunColor, initW.sunIntensity);
    this.sunLight.position.set(...initW.sunPos);
    this.scene.add(this.sunLight);

    this.lightningLight = new THREE.PointLight(0xffffff, 0, 300);
    this.lightningLight.position.set(0, 50, -100);
    this.scene.add(this.lightningLight);

    // Sun Disc
    this.sunDisc = new THREE.Mesh(
      new THREE.SphereGeometry(14, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffe9a8, fog: false })
    );
    this.sunDisc.position.set(10, 55, -340);
    this.scene.add(this.sunDisc);

    // Moon Disc (silvery-blue sphere for nighttime)
    this.moonDisc = new THREE.Mesh(
      new THREE.SphereGeometry(12, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xdce6f2, fog: false })
    );
    this.moonDisc.position.set(-10, 55, -340);
    this.moonDisc.visible = false;
    this.scene.add(this.moonDisc);
  }

  private initWorld() {
    // Terrain Ground (lush savannah grass / laterite soil)
    this.ground = createBox(500, 0.2, 700, 0x7c9450, 0, -0.15, -200, 0.9, 0.0);
    this.scene.add(this.ground);

    // Highway Asphalt
    this.roadMesh = createBox(11.2, 0.2, 700, 0x272b30, 0, -0.05, -200, 0.85, 0.1);
    this.scene.add(this.roadMesh);

    // Concrete shoulders and curbs
    [-1, 1].forEach(s => {
      this.scene.add(createBox(3.4, 0.35, 700, 0x9e998c, s * 7.3, 0.04, -200, 0.8, 0.1));
    });

    // Zuma Rock & Aso Rock distant monoliths
    const zumaRock = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshLambertMaterial({ color: 0x6e6355 }));
    zumaRock.scale.set(75, 45, 45);
    zumaRock.position.set(-85, 10, -310);
    this.scene.add(zumaRock);

    const asoRock = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshLambertMaterial({ color: 0x7a6c58 }));
    asoRock.scale.set(30, 50, 26);
    asoRock.position.set(70, 15, -300);
    this.scene.add(asoRock);

    // Procedural road segments with realistic Abuja buildings
    for (let i = 0; i < this.NS; i++) {
      const seg = new THREE.Group();
      seg.position.z = this.SL - i * this.SL;

      // Dashed lane dividers
      [-1.7, 1.7].forEach(x => {
        seg.add(createBox(0.2, 0.03, 5, 0xffffff, x, 0.07, -5));
      });

      // Roadside Streetlights, vegetation and realistic architecture
      [-1, 1].forEach((side) => {
        const sl = createStreetlight(side as -1 | 1);
        seg.add(sl);
        this.streetlights.push(sl);

        // African Mahogany / Neem tree
        const trunk = createBox(0.35, 2.4, 0.35, 0x5a3a22, side * 9.6, 1.2, -6);
        seg.add(trunk);
        const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), new THREE.MeshLambertMaterial({ color: 0x27672a }));
        leaves.position.set(side * 9.6, 3.6, -6);
        seg.add(leaves);

        // Realistic Abuja Architectural Building (Glass skyscrapers, plazas, financial towers)
        const bldgVariant = (i * 2 + (side === 1 ? 0 : 1)) % 4;
        const bldg = createRealisticBuilding(side as -1 | 1, bldgVariant);
        seg.add(bldg);
      });

      this.segs.push(seg);
      this.scene.add(seg);
    }
  }

  private initParticles() {
    // Rain Particles (2,500 streaks)
    const rainCount = 2500;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 50;
      rainPositions[i + 1] = Math.random() * 40;
      rainPositions[i + 2] = (Math.random() - 0.5) * 120 - 40;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x90caf9,
      size: 0.22,
      transparent: true,
      opacity: 0,
    });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainParticles);

    // Harmattan Dust Particles (1,200 motes)
    const dustCount = 1200;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 45;
      dustPositions[i + 1] = Math.random() * 25;
      dustPositions[i + 2] = (Math.random() - 0.5) * 100 - 30;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xdec18c,
      size: 0.35,
      transparent: true,
      opacity: 0,
    });
    this.dustParticles = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.dustParticles);
  }

  // --- GAME LIFECYCLE ---

  public startGame(key: VehicleKey) {
    this.vehicleKey = key;
    this.vehicleCfg = VEHICLE_CONFIGS[key];
    this.state = 'play';
    this.lane = 1;
    this.speed = 8;
    this.money = 0;
    this.lives = 3;
    this.dist = 0;
    this.riders = 0;
    this.invulnerability = 0;
    this.trafficTimer = 1.2;
    this.nextStopDist = 110;
    this.nextCityGateDist = 700;
    this.nextGantryDist = 250;
    this.nextBillboardDist = 120;
    this.nextHawkerDist = 60;
    this.nextPuddleDist = 30;
    this.totalPassengersServed = 0;
    this.puddlesSplashed = 0;
    this.hawkersGreeted = 0;
    this.passengersOnboard = [];
    this.stopSequenceIndex = 0;

    // Clear existing dynamic entities
    this.cleanupEntities();

    // Create player vehicle
    if (this.player) this.scene.remove(this.player);
    this.player = createVehicle(key, this.vehicleCfg.col, true);
    this.player.position.set(0, 0, 0);
    this.scene.add(this.player);

    this.callbacks.onLivesChange(this.lives);
    this.callbacks.onMoneyChange(this.money);
    this.callbacks.onRidersChange(this.riders, this.vehicleCfg.cap);
    this.callbacks.onPassengersChange(this.passengersOnboard, this.vehicleCfg.cap);
    this.updateOnboardPassengerMeshes();
    this.callbacks.onToast(`Hustle started in ${this.vehicleCfg.name}! Left lane + STOP to pick up passengers`);
    sound.unlock();
  }

  private updateOnboardPassengerMeshes() {
    if (!this.player || !this.player.passengerHolder) return;
    // Clear existing passenger models
    while (this.player.passengerHolder.children.length > 0) {
      this.player.passengerHolder.remove(this.player.passengerHolder.children[0]);
    }

    if (this.vehicleKey === 'bike') {
      // Okada: Render pillion passenger visibly seated behind the rider
      if (this.passengersOnboard.length > 0) {
        const pData = this.passengersOnboard[0];
        const pillion = createPillionPassenger(pData.shirtColor, pData.hasUmbrella);
        this.player.passengerHolder.add(pillion);
      }
    } else if (this.vehicleKey === 'cab') {
      // Corolla Cab: Render visible passengers seated inside cabin
      const seatPositions = [
        [0.45, 0.48, -0.05],  // Front passenger
        [-0.45, 0.48, 0.95], // Rear left
        [0.45, 0.48, 0.95],  // Rear right
      ];
      this.passengersOnboard.slice(0, 3).forEach((pData, idx) => {
        const pos = seatPositions[idx];
        const pMesh = createPerson(pData.shirtColor);
        pMesh.scale.set(0.68, 0.68, 0.68);
        pMesh.position.set(pos[0], pos[1], pos[2]);
        pMesh.lL.rotation.x = -1.2;
        pMesh.lR.rotation.x = -1.2;
        this.player!.passengerHolder!.add(pMesh);
      });
    } else if (this.vehicleKey === 'bus') {
      // Danfo Bus: Render passengers along rows of window seats
      const busSeats = [
        [-0.65, 1.05, -1.2],
        [0.65, 1.05, -1.2],
        [-0.65, 1.05, 0.0],
        [0.65, 1.05, 0.0],
        [-0.65, 1.05, 1.2],
        [0.65, 1.05, 1.2],
        [-0.65, 1.05, 2.4],
        [0.65, 1.05, 2.4],
      ];
      this.passengersOnboard.slice(0, 8).forEach((pData, idx) => {
        const pos = busSeats[idx];
        const pMesh = createPerson(pData.shirtColor);
        pMesh.scale.set(0.70, 0.70, 0.70);
        pMesh.position.set(pos[0], pos[1], pos[2]);
        this.player!.passengerHolder!.add(pMesh);
      });
    }
  }

  private cleanupEntities() {
    this.busStops.forEach(s => this.scene.remove(s.group));
    this.busStops = [];
    this.traffic.forEach(t => this.scene.remove(t.group));
    this.traffic = [];
    this.puddles.forEach(p => this.scene.remove(p.mesh));
    this.puddles = [];
    this.hawkers.forEach(h => this.scene.remove(h.group));
    this.hawkers = [];
    this.cityGates.forEach(g => this.scene.remove(g));
    this.cityGates = [];
    this.gantries.forEach(g => this.scene.remove(g));
    this.gantries = [];
    this.billboards.forEach(b => this.scene.remove(b));
    this.billboards = [];
    this.walkers = [];
    this.splashParticles.forEach(p => this.scene.remove(p.mesh));
    this.splashParticles = [];
    if (this.activeSpeechBubbleSprite) {
      if (this.player) this.player.remove(this.activeSpeechBubbleSprite);
      this.scene.remove(this.activeSpeechBubbleSprite);
      this.activeSpeechBubbleSprite = null;
    }
  }

  public setWeather(key: WeatherKey) {
    this.targetWeatherKey = key;
    this.weatherTransitionProgress = 0.0;
    const preset = WEATHER_PRESETS[key];
    this.callbacks.onWeatherChange(preset);
    this.callbacks.onToast(`Weather changed to ${preset.label} (${preset.temp})`);
  }

  public toggleAutoCycleWeather(): boolean {
    this.autoCycleWeather = !this.autoCycleWeather;
    this.callbacks.onToast(this.autoCycleWeather ? 'Dynamic Weather Cycle: ON' : 'Dynamic Weather Cycle: OFF');
    return this.autoCycleWeather;
  }

  public getAutoCycleWeather(): boolean {
    return this.autoCycleWeather;
  }

  public getCurrentWeather(): WeatherPreset {
    return WEATHER_PRESETS[this.targetWeatherKey];
  }

  public steer(dir: -1 | 1) {
    if (this.state !== 'play') return;
    this.lane = Math.max(0, Math.min(2, this.lane + dir));
  }

  public setBrake(isBraking: boolean) {
    this.isBraking = isBraking;
  }

  public honkHorn() {
    if (this.state !== 'play') return;
    sound.playHorn(this.vehicleKey);

    // Interactive Traffic Reaction
    let honkedCars = 0;
    this.traffic.forEach(t => {
      // If car is ahead in current lane within 45m
      const distZ = -t.group.position.z;
      if (distZ > 0 && distZ < 45 && Math.abs(t.group.position.x - this.LX[this.lane]) < 1.8) {
        // Accelerate or change lane
        t.speed += 6;
        honkedCars++;
      }
    });

    // Interactive Hawker Greeting
    let greetedHawker = false;
    this.hawkers.forEach(h => {
      if (!h.honked && Math.abs(h.z) < 18) {
        h.honked = true;
        greetedHawker = true;
        this.hawkersGreeted++;
        const bonus = 150;
        this.money += bonus;
        this.callbacks.onMoneyChange(this.money);
        sound.playCoin();

        // Cheerful visual pop
        const cheerText = h.type === 'suya' ? '🔥 Mai Suya: "Oga well done!" +₦150' : '❄️ "Pure Water chilled!" +₦150';
        this.callbacks.onToast(cheerText);
      }
    });

    // Random onboard passenger humorous honk reaction
    if (this.passengersOnboard.length > 0 && Math.random() > 0.55 && this.speechBubbleTimer <= 0) {
      const honkLines = [
        "Ehehn! Honk am well make dem comot for road!",
        "Danfo dey block road, blast horn for am!",
        "Clear road for oga driver!",
        "Oga driver press horn well well!",
      ];
      const line = honkLines[Math.floor(Math.random() * honkLines.length)];
      this.triggerPassengerSpeech(line, 'ride');
    } else if (honkedCars > 0 && !greetedHawker) {
      this.callbacks.onToast('HONK! Traffic clearing the lane!');
    }
  }

  // --- PASSENGER SPEECH BUBBLE & DIALOGUE SYSTEM ---
  public triggerPassengerSpeech(
    text: string,
    category: PassengerSpeech['category'],
    destStop?: string,
    speakerName?: string,
    avatarEmoji?: string
  ) {
    const emojis: Record<PassengerSpeech['category'], string> = {
      dropping: '🙋‍♂️',
      boarding: '👋',
      alighting: '🎉',
      missed: '😡',
      ride: '😄',
    };

    const speech: PassengerSpeech = {
      id: Math.random().toString(36).substring(2, 9),
      speakerName: speakerName || (destStop ? `Commuter to ${destStop}` : 'Passenger'),
      avatarEmoji: avatarEmoji || emojis[category] || '🗣️',
      destStop,
      text,
      category,
      timestamp: Date.now(),
    };

    if (category === 'dropping' || category === 'missed') {
      sound.playPassengerDropAlert();
    } else {
      sound.playPassengerChime();
    }

    // Emit to UI overlay callback
    this.callbacks.onPassengerSpeech?.(speech);

    // Update 3D Floating Speech Bubble Sprite above car
    if (this.activeSpeechBubbleSprite) {
      if (this.player) this.player.remove(this.activeSpeechBubbleSprite);
      this.activeSpeechBubbleSprite = null;
    }

    const bubbleBg = category === 'missed' ? '#fee2e2' : category === 'dropping' ? '#fef3c7' : '#ffffff';
    const bubble = createSpeechBubbleSprite(text, bubbleBg, '#111827', 4.5);
    const bubbleY = this.vehicleKey === 'bus' ? 4.2 : this.vehicleKey === 'bike' ? 2.6 : 2.5;
    bubble.position.set(0, bubbleY, 0);

    if (this.player) {
      this.player.add(bubble);
      this.activeSpeechBubbleSprite = bubble;
      this.speechBubbleTimer = 4.0;
    }
  }

  public toggleHeadlights(): boolean {
    this.playerHeadlightsManualOverride = true;
    this.headLightsOn = !this.headLightsOn;
    this.callbacks.onHeadlightsChange?.(this.headLightsOn);
    this.callbacks.onToast(this.headLightsOn ? 'Headlights: ON' : 'Headlights: OFF');
    return this.headLightsOn;
  }

  public setHeadlights(on: boolean, isAuto = false): boolean {
    if (!isAuto) this.playerHeadlightsManualOverride = true;
    this.headLightsOn = on;
    this.callbacks.onHeadlightsChange?.(this.headLightsOn);
    return this.headLightsOn;
  }

  public getTimeOfDayInfo(hours: number = this.timeOfDayHours): TimeOfDayInfo {
    const totalMinutes = Math.floor(hours * 60);
    const h24 = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const timeString = `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;

    let periodLabel = 'Day';
    let icon = '☀️';
    if (hours >= 5.0 && hours < 7.0) {
      periodLabel = 'Dawn / Sunrise';
      icon = '🌅';
    } else if (hours >= 7.0 && hours < 11.5) {
      periodLabel = 'Morning';
      icon = '🌤️';
    } else if (hours >= 11.5 && hours < 15.5) {
      periodLabel = 'Midday Sun';
      icon = '☀️';
    } else if (hours >= 15.5 && hours < 18.0) {
      periodLabel = 'Harmattan Glow';
      icon = '🌤️';
    } else if (hours >= 18.0 && hours < 19.5) {
      periodLabel = 'Sunset / Dusk';
      icon = '🌆';
    } else if (hours >= 19.5 && hours < 22.0) {
      periodLabel = 'Evening Twilight';
      icon = '🌃';
    } else {
      periodLabel = 'Midnight';
      icon = '🌙';
    }

    let darkness = 0;
    if (hours >= 7 && hours <= 17) {
      const middayDist = Math.abs(hours - 12);
      darkness = 0.05 + Math.pow(middayDist / 5, 2) * 0.15;
    } else if (hours > 17 && hours <= 20) {
      const t = (hours - 17) / 3;
      darkness = 0.2 + 0.75 * (t * t * (3 - 2 * t));
    } else if (hours > 20 || hours < 5) {
      darkness = 1.0;
    } else {
      const t = (hours - 5) / 2;
      darkness = 1.0 - 0.8 * (t * t * (3 - 2 * t));
    }

    if (this.currentWeatherKey === 'thunderstorm') {
      darkness = Math.min(1.0, darkness + 0.35);
    } else if (this.currentWeatherKey === 'rain') {
      darkness = Math.min(1.0, darkness + 0.15);
    }

    const isNight = darkness >= 0.45;

    return {
      hours,
      timeString,
      periodLabel,
      icon,
      darkness,
      isNight,
      autoLightsActive: isNight,
    };
  }

  public setTimeOfDay(hours: number) {
    this.timeOfDayHours = ((hours % 24) + 24) % 24;
    const timeInfo = this.getTimeOfDayInfo();
    this.callbacks.onTimeChange?.(timeInfo);
  }

  public setDayCycleSpeed(speed: number) {
    this.dayCycleSpeed = speed;
  }

  public toggleDayCycle(): boolean {
    this.isDayCycleActive = !this.isDayCycleActive;
    this.callbacks.onToast(this.isDayCycleActive ? 'Day-Night Cycle: Active' : 'Day-Night Cycle: Paused');
    return this.isDayCycleActive;
  }

  public isDayCycleEnabled(): boolean {
    return this.isDayCycleActive;
  }

  public toggleWipers(): boolean {
    this.wipersActive = !this.wipersActive;
    if (this.wipersActive) sound.playWiper();
    this.callbacks.onToast(this.wipersActive ? 'Wipers: ON' : 'Wipers: OFF');
    return this.wipersActive;
  }

  public toggleCameraView(): 'chase' | 'hood' {
    this.cameraView = this.cameraView === 'chase' ? 'hood' : 'chase';
    this.callbacks.onToast(this.cameraView === 'chase' ? 'Camera: Chase View' : 'Camera: Cockpit Hood View');
    return this.cameraView;
  }

  public getCameraView(): 'chase' | 'hood' {
    return this.cameraView;
  }

  public pause() {
    this.isGamePaused = true;
    sound.stopAll();
  }

  public resume() {
    this.isGamePaused = false;
    this.lastTime = performance.now();
    sound.unlock();
  }

  public restart(key?: VehicleKey) {
    this.isGamePaused = false;
    this.startGame(key || this.vehicleKey);
  }

  public isPaused(): boolean {
    return this.isGamePaused;
  }

  // --- BUS STOPS GENERATION ---
  private createBusStop(fare: number) {
    const BUS_STOP_NAMES = [
      'Nyanya', 'Area 1', 'Garki 2', 'Wuse Market', 'Maitama Junction',
      'Berger Roundabout', 'Jabi Lake', 'Utako Market', 'Gwarinpa Estate', 'Kubwa Express',
    ];
    const currentIdx = this.stopSequenceIndex;
    const name = BUS_STOP_NAMES[currentIdx % BUS_STOP_NAMES.length];
    this.stopSequenceIndex++;

    const g = new THREE.Group();

    // Shelter Roof
    g.add(createBox(3.4, 0.16, 4.2, 0x0f9d58, -7.2, 3.0, 0, 0.4));
    // Pillars
    g.add(createBox(0.14, 3.0, 0.14, 0x444444, -5.9, 1.5, -1.8));
    g.add(createBox(0.14, 3.0, 0.14, 0x444444, -5.9, 1.5, 1.8));
    // Back glass wall
    g.add(createBox(0.1, 2.0, 3.8, 0x9fd0e8, -8.6, 2.0, 0, 0.1, 0.9));
    // Bench
    g.add(createBox(0.6, 0.14, 2.8, 0x6b4a2b, -8.1, 0.75, 0));

    // Signboard
    const sign = createLabelSprite(`${name} Bus Stop`, '#0b5d34', 4.0);
    sign.position.set(-7.2, 3.85, 0);
    g.add(sign);

    // Weather-adapted passengers with assigned destinations
    const isRaining = this.currentWeatherKey === 'rain' || this.currentWeatherKey === 'thunderstorm';
    const numWaiting = 1 + Math.floor(Math.random() * 3);
    const ppl: PersonGroup[] = [];

    const shirtColors = [0xd6402b, 0x2b6cd6, 0xf2c230, 0xffffff, 0x8e44ad, 0xe67e22];
    for (let i = 0; i < numWaiting; i++) {
      const shirt = shirtColors[Math.floor(Math.random() * shirtColors.length)];
      const hasUmbrella = isRaining && (i % 2 === 0);
      const p = createPerson(shirt, hasUmbrella);
      p.position.set(-6.6 - Math.random() * 0.8, 0, -1.2 + i * 1.2);
      p.rotation.y = Math.PI / 2;

      // Assign destination from upcoming stops along highway
      const jump = 1 + Math.floor(Math.random() * 3);
      const destStop = BUS_STOP_NAMES[(currentIdx + jump) % BUS_STOP_NAMES.length];
      const weatherMult = WEATHER_PRESETS[this.currentWeatherKey].fareMultiplier;
      const actualFare = Math.round((fare + (jump - 1) * 50) * weatherMult);

      p.destStop = destStop;
      p.originStop = name;
      p.farePrice = actualFare;
      p.shirtColor = shirt;
      p.hasUmbrella = hasUmbrella;

      // Destination and fare badge
      const fareTag = createLabelSprite(`📍 ${destStop} · ₦${actualFare}`, '#b8860b', 2.8, '#ffffff');
      fareTag.position.set(0, 2.6, 0);
      p.add(fareTag);
      p.f = fareTag;

      g.add(p);
      ppl.push(p);
    }

    g.position.z = -260;
    this.scene.add(g);
    this.busStops.push({
      group: g,
      ppl,
      name,
      fare,
      alit: false,
      missed: false,
      notified: false,
      missedDrop: false,
    });
  }

  // --- TRAFFIC SPAWNER ---
  private spawnTrafficCar() {
    const keys: VehicleKey[] = ['cab', 'cab', 'bus', 'bike'];
    const chosenKey = keys[Math.floor(Math.random() * keys.length)];
    const colors = [0x9ebd99, 0xf2c230, 0xffffff, 0x2b6cd6, 0xd6402b, 0x9ebd99];
    const col = chosenKey === 'cab' && Math.random() > 0.35 ? 0x9ebd99 : colors[Math.floor(Math.random() * colors.length)];
    const targetLane = Math.floor(Math.random() * 3);

    // Avoid spawning directly on top of bus stop in left lane
    const stopNear = this.busStops.some(s => s.group.position.z < 10 && s.group.position.z > -240);
    if (targetLane === 0 && stopNear) return;

    const car = createVehicle(chosenKey, col, false);
    car.position.set(this.LX[targetLane], 0, -260);
    this.scene.add(car);

    const baseSpd = chosenKey === 'bike' ? 14 : chosenKey === 'cab' ? 11 : 9;
    this.traffic.push({
      group: car,
      speed: baseSpd + Math.random() * 4,
      lane: targetLane,
    });
  }

  // --- DAY-NIGHT CYCLE & WEATHER INTERPOLATOR ---
  private updateWeather(dt: number) {
    // 1. Advance in-game 24-hour Day-Night clock
    if (this.isDayCycleActive && this.state === 'play') {
      this.timeOfDayHours = (this.timeOfDayHours + dt * this.dayCycleSpeed) % 24;
    }

    // Dynamic Weather Cycle timer (if enabled, cycles between climates)
    if (this.autoCycleWeather && this.state === 'play') {
      this.weatherCycleTimer += dt;
      if (this.weatherCycleTimer >= this.WEATHER_CYCLE_DURATION) {
        this.weatherCycleTimer = 0;
        const currentIdx = WEATHER_ORDER.indexOf(this.targetWeatherKey);
        const nextIdx = (currentIdx + 1) % WEATHER_ORDER.length;
        this.setWeather(WEATHER_ORDER[nextIdx]);
      }
    }

    // Smooth transition between current and target weather presets
    if (this.weatherTransitionProgress < 1.0) {
      this.weatherTransitionProgress = Math.min(1.0, this.weatherTransitionProgress + dt * 0.4);
    }

    const cur = WEATHER_PRESETS[this.currentWeatherKey];
    const tgt = WEATHER_PRESETS[this.targetWeatherKey];
    const wt = this.weatherTransitionProgress;
    const rainInt = THREE.MathUtils.lerp(cur.rainIntensity, tgt.rainIntensity, wt);
    const dustInt = THREE.MathUtils.lerp(cur.dustIntensity, tgt.dustIntensity, wt);

    if (this.weatherTransitionProgress >= 1.0) {
      this.currentWeatherKey = this.targetWeatherKey;
    }

    // 2. Interpolate Day-Night lighting keyframes based on current hour
    const h = this.timeOfDayHours;
    let kIdx = 0;
    for (let i = 0; i < DAY_LIGHT_KEYFRAMES.length - 1; i++) {
      if (h >= DAY_LIGHT_KEYFRAMES[i].hour && h <= DAY_LIGHT_KEYFRAMES[i + 1].hour) {
        kIdx = i;
        break;
      }
    }
    const kA = DAY_LIGHT_KEYFRAMES[kIdx];
    const kB = DAY_LIGHT_KEYFRAMES[kIdx + 1];
    const frac = (h - kA.hour) / (kB.hour - kA.hour || 1);
    const smoothFrac = frac * frac * (3 - 2 * frac); // smoothstep

    const baseSkyColor = new THREE.Color(kA.skyColor).lerp(new THREE.Color(kB.skyColor), smoothFrac);
    const baseFogColor = new THREE.Color(kA.fogColor).lerp(new THREE.Color(kB.fogColor), smoothFrac);
    const baseSunColor = new THREE.Color(kA.sunColor).lerp(new THREE.Color(kB.sunColor), smoothFrac);
    const baseSunInt = THREE.MathUtils.lerp(kA.sunIntensity, kB.sunIntensity, smoothFrac);
    const baseAmbColor = new THREE.Color(kA.ambColor).lerp(new THREE.Color(kB.ambColor), smoothFrac);
    const baseAmbInt = THREE.MathUtils.lerp(kA.ambIntensity, kB.ambIntensity, smoothFrac);

    // Blend with active weather conditions (Rain/Storm darkens sky, Harmattan adds golden dust)
    let finalSkyColor = baseSkyColor.clone();
    let finalFogColor = baseFogColor.clone();
    let finalSunInt = baseSunInt;
    let finalAmbInt = baseAmbInt;

    if (rainInt > 0.05) {
      const stormSky = new THREE.Color(this.targetWeatherKey === 'thunderstorm' ? 0x141e28 : 0x415364);
      finalSkyColor.lerp(stormSky, Math.min(0.85, rainInt * 0.75));
      finalFogColor.lerp(new THREE.Color(0x324250), Math.min(0.8, rainInt * 0.7));
      finalSunInt *= Math.max(0.15, 1 - rainInt * 0.65);
      finalAmbInt *= Math.max(0.3, 1 - rainInt * 0.35);
    }

    if (dustInt > 0.05) {
      const harmattanTint = new THREE.Color(0xdfbe8c);
      finalSkyColor.lerp(harmattanTint, dustInt * 0.55);
      finalFogColor.lerp(harmattanTint, dustInt * 0.65);
    }

    // Apply scene background & fog
    this.scene.background = finalSkyColor;
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color = finalFogColor;
      const fogNearBase = THREE.MathUtils.lerp(cur.fogNear, tgt.fogNear, wt);
      const fogFarBase = THREE.MathUtils.lerp(cur.fogFar, tgt.fogFar, wt);
      this.scene.fog.near = fogNearBase;
      this.scene.fog.far = fogFarBase;
    }

    this.sunLight.color = baseSunColor;
    this.sunLight.intensity = Math.max(0.2, finalSunInt);
    this.hemiLight.color = baseAmbColor;
    this.hemiLight.intensity = Math.max(0.25, finalAmbInt);

    // 3. Sun and Moon orbital movement
    // Sun rises East (6:00), peaks overhead (12:00), sets West (18:00)
    const sunProg = (h - 6) / 12;
    const sunAngle = sunProg * Math.PI;
    const sunX = Math.cos(sunAngle) * 180;
    const sunY = Math.sin(sunAngle) * 140;

    if (sunProg >= -0.05 && sunProg <= 1.05 && sunY > -5) {
      this.sunDisc.visible = true;
      this.sunDisc.position.set(sunX * 0.9, Math.max(0, sunY * 0.9), -320);
      this.sunLight.position.set(sunX, Math.max(15, sunY), -120);
    } else {
      this.sunDisc.visible = false;
    }

    // Moon rises East (18:00), peaks overhead (0:00 midnight), sets West (6:00)
    const moonProg = ((h - 18 + 24) % 24) / 12;
    const moonAngle = moonProg * Math.PI;
    const moonX = -Math.cos(moonAngle) * 160;
    const moonY = Math.sin(moonAngle) * 130;

    if (moonProg >= -0.05 && moonProg <= 1.05 && moonY > -5) {
      this.moonDisc.visible = true;
      this.moonDisc.position.set(moonX * 0.9, Math.max(0, moonY * 0.9), -320);
      if (!this.sunDisc.visible) {
        this.sunLight.position.set(moonX, Math.max(15, moonY), -120);
      }
    } else {
      this.moonDisc.visible = false;
    }

    // 4. Automatic Daylight & Darkness Threshold Detection
    const timeInfo = this.getTimeOfDayInfo();
    const isDark = timeInfo.isNight;
    const darkness = timeInfo.darkness;

    if (isDark !== this.isDarkTime) {
      this.isDarkTime = isDark;
      if (isDark) {
        // Automatically activate streetlights and vehicle headlights as it gets darker
        if (!this.playerHeadlightsManualOverride) {
          this.headLightsOn = true;
          this.callbacks.onHeadlightsChange?.(true);
        }
        this.callbacks.onToast('🌆 Dusk falling in Abuja: Streetlights & vehicle headlights turned ON automatically!');
      } else {
        // Dawn arrives: dim headlights and streetlights
        if (!this.playerHeadlightsManualOverride) {
          this.headLightsOn = false;
          this.callbacks.onHeadlightsChange?.(false);
        }
        this.callbacks.onToast('🌅 Dawn over Zuma Rock: Streetlights and headlights dimmed!');
      }
    }

    // 5. Update Streetlights (Bulb glowing + volumetric downward beam + ground puddle glow)
    const lightOpacity = THREE.MathUtils.clamp(darkness, 0.4, 1.0);
    this.streetlights.forEach(sl => {
      const bulb = sl.getObjectByName('bulb') as THREE.Mesh;
      const beam = sl.getObjectByName('beam') as THREE.Mesh;
      const groundPool = sl.getObjectByName('groundPool') as THREE.Mesh;

      if (bulb && bulb.material instanceof THREE.MeshBasicMaterial) {
        bulb.material.color.setHex(isDark ? 0xffbe3b : 0x33373d);
      }
      if (beam && beam.material instanceof THREE.MeshBasicMaterial) {
        beam.visible = isDark;
        if (isDark) beam.material.opacity = 0.16 * lightOpacity;
      }
      if (groundPool && groundPool.material instanceof THREE.MeshBasicMaterial) {
        groundPool.visible = isDark;
        if (isDark) groundPool.material.opacity = 0.24 * lightOpacity;
      }
    });

    // 6. Update Vehicle Headlights & Taillights (Player and Traffic)
    if (this.player) {
      this.updateVehicleLights(this.player, this.headLightsOn, this.isBraking, isDark, darkness);
    }

    this.traffic.forEach(t => {
      // Traffic vehicles automatically turn on their headlights & taillights at dusk/night
      this.updateVehicleLights(t.group, isDark, false, isDark, darkness);
    });

    // 7. Road wetness & reflection from rain
    const roadMat = this.roadMesh.material as THREE.MeshStandardMaterial;
    if (roadMat) {
      roadMat.roughness = THREE.MathUtils.lerp(0.85, 0.15, rainInt);
      roadMat.metalness = THREE.MathUtils.lerp(0.1, 0.75, rainInt);
    }

    // Rain Sound & Particles
    sound.setRainIntensity(rainInt);
    const rainPointsMat = this.rainParticles.material as THREE.PointsMaterial;
    rainPointsMat.opacity = THREE.MathUtils.lerp(0, 0.75, rainInt);

    // Dust Particles
    const dustPointsMat = this.dustParticles.material as THREE.PointsMaterial;
    dustPointsMat.opacity = THREE.MathUtils.lerp(0, 0.65, dustInt);

    // Update Rain streaks animation
    if (rainInt > 0.05) {
      const pos = this.rainParticles.geometry.attributes.position.array as Float32Array;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        pos[idx + 1] -= (28 + this.speed * 0.4) * dt;
        pos[idx + 2] += (this.speed * 0.8) * dt;
        if (pos[idx + 1] < 0) {
          pos[idx + 1] = 35 + Math.random() * 5;
          pos[idx] = (Math.random() - 0.5) * 45;
          pos[idx + 2] = (Math.random() - 0.5) * 110 - 20;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Update Dust motes animation
    if (dustInt > 0.05) {
      const pos = this.dustParticles.geometry.attributes.position.array as Float32Array;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        pos[idx] += Math.sin(this.gameTime + i) * dt * 2.5;
        pos[idx + 2] += (this.speed * 0.6) * dt;
        if (pos[idx + 2] > 20) {
          pos[idx + 2] = -90 - Math.random() * 20;
        }
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Thunderstorm Lightning Generator
    if (this.currentWeatherKey === 'thunderstorm' && this.state === 'play') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.triggerLightning();
        this.lightningTimer = 5 + Math.random() * 7;
      }

      if (this.lightningFlashDuration > 0) {
        this.lightningFlashDuration -= dt;
        const flashIntensity = this.lightningFlashDuration > 0.06 ? 8.0 : 3.0;
        this.lightningLight.intensity = flashIntensity;
        this.scene.background = new THREE.Color(0xd0e8ff);
      } else {
        this.lightningLight.intensity = 0;
      }
    } else {
      this.lightningLight.intensity = 0;
    }

    // Emit live TimeOfDay info periodically
    this.timeEmitTimer += dt;
    if (this.timeEmitTimer >= 0.25) {
      this.timeEmitTimer = 0;
      this.callbacks.onTimeChange?.(timeInfo);
    }
  }

  // --- VEHICLE HEADLIGHTS & TAILLIGHTS UPDATE HELPER ---
  private updateVehicleLights(
    v: VehicleMeshGroup,
    headlightsActive: boolean,
    braking: boolean,
    isNight: boolean,
    darkness: number
  ) {
    // Front headlights lenses
    if (v.headlights) {
      v.headlights.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.MeshBasicMaterial) {
            child.material.color.setHex(headlightsActive ? 0xffffff : 0x444444);
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.setHex(headlightsActive ? 0xffffff : 0x333333);
            child.material.emissive?.setHex(headlightsActive ? 0xffffff : 0x000000);
          }
        }
      });
    }

    // Forward headlight conical light beams
    if (v.headlightBeams) {
      v.headlightBeams.visible = headlightsActive;
      if (headlightsActive) {
        const beamAlpha = 0.22 * (isNight ? THREE.MathUtils.clamp(darkness, 0.4, 1.0) : 0.45);
        v.headlightBeams.children.forEach(b => {
          if (b instanceof THREE.Mesh && b.material instanceof THREE.MeshBasicMaterial) {
            b.material.opacity = beamAlpha;
          }
        });
      }
    }

    // Rear taillights & brake lights
    if (v.taillights) {
      v.taillights.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.MeshBasicMaterial) {
            child.material.color.setHex(braking ? 0xff1744 : (isNight || headlightsActive ? 0xd63031 : 0x441010));
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            if (braking) {
              child.material.color.setHex(0xff1744);
              child.material.emissive?.setHex(0xff1744);
            } else if (isNight || headlightsActive) {
              child.material.color.setHex(0xd63031);
              child.material.emissive?.setHex(0x550a0a);
            } else {
              child.material.color.setHex(0x441010);
              child.material.emissive?.setHex(0x000000);
            }
          }
        }
      });
    }
  }

  private triggerLightning() {
    this.lightningFlashDuration = 0.14; // Double flash sensation
    this.shakeAmount = 0.5;
    sound.playThunder();
  }

  // --- SPAWN WATER PUDDLES ---
  private spawnPuddle() {
    const lane = Math.floor(Math.random() * 3);
    const radius = 1.1 + Math.random() * 0.7;
    const mesh = createPuddleMesh(radius);
    const x = this.LX[lane] + (Math.random() - 0.5) * 0.8;
    const z = -250;
    mesh.position.set(x, 0.04, z);
    this.scene.add(mesh);
    this.puddles.push({ mesh, x, z, lane, radius, active: true });
  }

  private triggerSplash(x: number, z: number) {
    this.puddlesSplashed++;
    sound.playSplash();
    this.shakeAmount = 0.25;

    // Emit 16 water droplets
    for (let i = 0; i < 16; i++) {
      const geo = new THREE.SphereGeometry(0.12, 6, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0x90caf9, transparent: true, opacity: 0.8 });
      const drop = new THREE.Mesh(geo, mat);
      drop.position.set(x + (Math.random() - 0.5) * 1.5, 0.2, z + (Math.random() - 0.5) * 1.0);
      this.scene.add(drop);

      const angle = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 5;
      this.splashParticles.push({
        mesh: drop,
        vx: Math.cos(angle) * spd,
        vy: 3 + Math.random() * 4,
        vz: Math.sin(angle) * spd,
        life: 0.35 + Math.random() * 0.25,
      });
    }
  }

  // --- SPAWN HAWKER ---
  private spawnHawker() {
    const side = Math.random() > 0.5 ? 1 : -1;
    const types: ('suya' | 'water' | 'gala')[] = ['suya', 'water', 'gala'];
    const type = types[Math.floor(Math.random() * types.length)];
    const stand = createHawkerStand(type);
    const x = side * (6.5 + Math.random() * 0.8);
    const z = -260;
    stand.position.set(x, 0, z);
    this.scene.add(stand);
    this.hawkers.push({ group: stand, x, z, type, honked: false });
  }

  // --- SPAWN CITY GATE LANDMARK ---
  private spawnCityGate() {
    const gate = createAbujaCityGate();
    gate.position.set(0, 0, -280);
    this.scene.add(gate);
    this.cityGates.push(gate);
  }

  // --- SPAWN HIGHWAY EXIT GANTRY ---
  private spawnGantry() {
    const exitText = HIGHWAY_EXITS[Math.floor(Math.random() * HIGHWAY_EXITS.length)];
    const gantry = createOverheadHighwaySign(exitText);
    gantry.position.set(0, 0, -270);
    this.scene.add(gantry);
    this.gantries.push(gantry);
  }

  // --- SPAWN BILLBOARD ---
  private spawnBillboard() {
    const side = Math.random() > 0.5 ? 1 : -1;
    const ad = BILLBOARD_ADS[Math.floor(Math.random() * BILLBOARD_ADS.length)];
    const bb = createBillboard(ad.text, ad.sub, ad.col, side as -1 | 1);
    bb.position.set(0, 0, -280);
    this.scene.add(bb);
    this.billboards.push(bb);
  }

  // --- MAIN LOOP UPDATE ---
  public update() {
    if (this.isGamePaused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.gameTime += dt;

    this.updateWeather(dt);

    // Update active 3D Speech Bubble timer
    if (this.speechBubbleTimer > 0) {
      this.speechBubbleTimer -= dt;
      if (this.speechBubbleTimer <= 0) {
        if (this.activeSpeechBubbleSprite && this.player) {
          this.player.remove(this.activeSpeechBubbleSprite);
          this.activeSpeechBubbleSprite = null;
        }
      }
    }

    // Speed physics
    const currentPreset = WEATHER_PRESETS[this.currentWeatherKey];
    const friction = currentPreset.roadFriction;

    if (this.state === 'play') {
      const topSpeed = this.vehicleCfg.max * (1 + Math.min(0.2, this.dist / 25000));
      const targetSpeed = this.isBraking ? 0 : topSpeed;
      const accelRate = this.isBraking ? 3.4 * friction : 1.1 * this.vehicleCfg.acceleration;
      this.speed += (targetSpeed - this.speed) * Math.min(1, dt * accelRate);
      if (this.isBraking && this.speed < 0.4) this.speed = 0;
      this.dist += (this.speed * dt) / 1.5;

      this.callbacks.onSpeedChange(Math.round(this.speed * 3.6)); // km/h
      this.callbacks.onDistChange(Math.round(this.dist));
      sound.updateEngine(this.speed / this.vehicleCfg.max, this.vehicleKey);
    } else {
      this.speed = 8;
      sound.updateEngine(0.2, 'cab');
    }

    const dz = this.speed * dt;

    // Scroll road segments
    this.segs.forEach(s => {
      s.position.z += dz;
      if (s.position.z > 30) {
        s.position.z -= this.NS * this.SL;
      }
    });

    if (this.state === 'play' && this.player) {
      // Player lane movement
      const targetX = this.LX[this.lane];
      const handlingSpeed = this.vehicleCfg.handling * friction;
      this.player.position.x += (targetX - this.player.position.x) * Math.min(1, dt * handlingSpeed);
      this.player.rotation.z = (targetX - this.player.position.x) * -0.06;
      this.player.position.y = Math.sin(this.gameTime * 20) * 0.02 * (this.speed > 1 ? 1 : 0);

      // Invulnerability flicker
      if (this.invulnerability > 0) {
        this.invulnerability -= dt;
        this.player.visible = Math.floor(this.gameTime * 14) % 2 === 0;
      } else {
        this.player.visible = true;
      }

      // Windshield Wiper Animation
      const shouldWipe = this.wipersActive || this.currentWeatherKey === 'rain' || this.currentWeatherKey === 'thunderstorm';
      if (shouldWipe && this.player.wipers) {
        this.wiperAngle += this.wiperDir * dt * 4.5;
        if (Math.abs(this.wiperAngle) > 0.6) {
          this.wiperDir *= -1;
          if (this.currentWeatherKey === 'rain') sound.playWiper();
        }
        this.player.wipers.children.forEach(wp => {
          wp.rotation.z = this.wiperAngle;
        });
      }

      // Headlight glow
      if (this.player.headlights) {
        const isNight = this.currentWeatherKey === 'night' || this.currentWeatherKey === 'thunderstorm';
        this.player.headlights.visible = this.headLightsOn && isNight;
      }

      // Puddle generation during rain
      const isRainy = this.currentWeatherKey === 'rain' || this.currentWeatherKey === 'thunderstorm';
      if (isRainy) {
        this.nextPuddleDist -= dz;
        if (this.nextPuddleDist <= 0) {
          this.spawnPuddle();
          this.nextPuddleDist = 30 + Math.random() * 35;
        }
      }

      // Check Puddle Collisions
      for (let i = this.puddles.length - 1; i >= 0; i--) {
        const p = this.puddles[i];
        p.z += dz;
        p.mesh.position.z = p.z;
        if (p.active && Math.abs(p.z) < 1.4 && Math.abs(this.player.position.x - p.x) < p.radius) {
          p.active = false;
          this.triggerSplash(p.x, p.z);
        }
        if (p.z > 30) {
          this.scene.remove(p.mesh);
          this.puddles.splice(i, 1);
        }
      }

      // Hawkers generation
      this.nextHawkerDist -= dz;
      if (this.nextHawkerDist <= 0) {
        this.spawnHawker();
        this.nextHawkerDist = 80 + Math.random() * 90;
      }
      for (let i = this.hawkers.length - 1; i >= 0; i--) {
        const h = this.hawkers[i];
        h.z += dz;
        h.group.position.z = h.z;
        if (h.z > 35) {
          this.scene.remove(h.group);
          this.hawkers.splice(i, 1);
        }
      }

      // City Gate generation
      this.nextCityGateDist -= dz;
      if (this.nextCityGateDist <= 0) {
        this.spawnCityGate();
        this.nextCityGateDist = 1400 + Math.random() * 400;
      }
      for (let i = this.cityGates.length - 1; i >= 0; i--) {
        const gate = this.cityGates[i];
        gate.position.z += dz;
        // Check milestone pass
        if (gate.position.z > 0 && gate.position.z < 8 && !(gate as unknown as { passed?: boolean }).passed) {
          (gate as unknown as { passed?: boolean }).passed = true;
          this.money += 1500;
          this.callbacks.onMoneyChange(this.money);
          sound.playMilestone();
          this.callbacks.onToast('🎉 Welcome to Abuja! Reached City Gate (+₦1,500 Milestone Bonus)');
        }
        if (gate.position.z > 35) {
          this.scene.remove(gate);
          this.cityGates.splice(i, 1);
        }
      }

      // Highway Gantries
      this.nextGantryDist -= dz;
      if (this.nextGantryDist <= 0) {
        this.spawnGantry();
        this.nextGantryDist = 320 + Math.random() * 180;
      }
      for (let i = this.gantries.length - 1; i >= 0; i--) {
        const g = this.gantries[i];
        g.position.z += dz;
        if (g.position.z > 35) {
          this.scene.remove(g);
          this.gantries.splice(i, 1);
        }
      }

      // Billboards
      this.nextBillboardDist -= dz;
      if (this.nextBillboardDist <= 0) {
        this.spawnBillboard();
        this.nextBillboardDist = 180 + Math.random() * 120;
      }
      for (let i = this.billboards.length - 1; i >= 0; i--) {
        const b = this.billboards[i];
        b.position.z += dz;
        if (b.position.z > 35) {
          this.scene.remove(b);
          this.billboards.splice(i, 1);
        }
      }

      // Bus Stops
      this.nextStopDist -= dz;
      if (this.nextStopDist <= 0) {
        this.createBusStop(this.vehicleCfg.fare);
        this.nextStopDist = 260 + Math.random() * 160;
      }

      for (const s of this.busStops) {
        s.group.position.z += dz;

        // Waiting passengers hand-wave animation
        s.ppl.forEach(p => {
          if (!p.walk) {
            p.aR.rotation.z = 2.6 + Math.sin(this.gameTime * 9 + p.ph) * 0.35;
            p.position.y = Math.abs(Math.sin(this.gameTime * 4 + p.ph)) * 0.03;
          }
        });

        // Destination Alert: check if onboard passengers want to alight at this stop
        const dropList = this.passengersOnboard.filter(p => p.destStop === s.name);
        if (dropList.length > 0 && Math.abs(s.group.position.z) < 55 && !s.notified) {
          s.notified = true;
          const dropAlerts = [
            "driver i dey drop o!!",
            "Driver, I dey drop o!! Stop for front!",
            `driver i dey drop o!! ${s.name} dey come!`,
            "Driver I dey drop o!! Hold brake abeg!",
            "Oga driver, I dey drop o!! Beside that blue gate!",
          ];
          const dropText = dropAlerts[Math.floor(Math.random() * dropAlerts.length)];
          this.triggerPassengerSpeech(dropText, 'dropping', s.name, `Passenger to ${s.name}`, '🙋‍♂️');
          this.callbacks.onToast(`🗣️ "${dropText}" (📍 ${s.name} — Move to LEFT lane & STOP!)`);
        }

        const nearStop = Math.abs(s.group.position.z) < 10;
        const inLeftLane = Math.abs(this.player.position.x - this.LX[0]) < 0.85;

        // Boarding / Alighting trigger
        if (nearStop && inLeftLane && this.speed < 1.6) {
          // 1. Passengers alighting at their destination
          if (!s.alit) {
            s.alit = true;
            if (dropList.length > 0) {
              let earned = 0;
              dropList.forEach(p => {
                earned += p.fare + 100; // on-time destination drop bonus!
                this.totalPassengersServed++;
              });
              this.money += earned;
              this.callbacks.onMoneyChange(this.money);
              sound.playCoin();

              // Remove from onboard list
              this.passengersOnboard = this.passengersOnboard.filter(p => p.destStop !== s.name);
              this.riders = this.passengersOnboard.length;
              this.callbacks.onRidersChange(this.riders, this.vehicleCfg.cap);
              this.callbacks.onPassengersChange([...this.passengersOnboard], this.vehicleCfg.cap);
              this.updateOnboardPassengerMeshes();

              const alightAlerts = [
                "driver i dey drop o!! Well done oga, hustle dey pay!",
                "Oga keep the change, God bless your hustle!",
                "Alight here o! Safe journey driver!",
                "Driver your driving smooth pass Uber! Thank you!",
                "Thank you oga! Five-star driver!",
              ];
              const aQuote = alightAlerts[Math.floor(Math.random() * alightAlerts.length)];
              this.triggerPassengerSpeech(aQuote, 'alighting', s.name, 'Commuter alighting', '🎉');

              this.callbacks.onToast(`🎉 Dropped ${dropList.length} passenger${dropList.length > 1 ? 's' : ''} at ${s.name}! (+₦${earned.toLocaleString()} fare & on-time bonus)`);
            }
          }

          // 2. Waiting passengers boarding
          this.boardTimer -= dt;
          const waitingP = s.ppl.find(p => !p.walk);
          if (waitingP && this.boardTimer <= 0 && this.passengersOnboard.length + this.walkers.length < this.vehicleCfg.cap) {
            this.boardTimer = 0.55;
            waitingP.walk = 1;
            waitingP.t = 0;
            waitingP.sx = waitingP.position.x;
            waitingP.sz = waitingP.position.z;
            if (waitingP.f) waitingP.remove(waitingP.f);
            waitingP.aR.rotation.z = 0;
            waitingP.s = s.group;
            this.walkers.push(waitingP);

            sound.playCoin();

            // Context-aware randomized dialogue when commuters board
            let boardAlerts = [
              `Good day driver! ${waitingP.destStop} please, make we fast!`,
              `Oga abeg carry me go ${waitingP.destStop}!`,
              "Driver shift small make I balance!",
              "No change o, ₦1,000 note I hold!",
              `Drop me for ${waitingP.destStop} o! Safe journey!`,
            ];
            if (this.currentWeatherKey === 'rain' || this.currentWeatherKey === 'thunderstorm') {
              boardAlerts = [
                "Thank God say you stop! This rain wan finish person!",
                "Driver zoom off quick, heavy rain dey fall!",
                `Maitama express! Close glass small, rain dey enter!`,
              ];
            } else if (this.currentWeatherKey === 'sunny' || this.currentWeatherKey === 'harmattan') {
              boardAlerts = [
                "Chai, this Abuja sun! Driver oya let's go!",
                "Oga driver, enter sharp sharp! AC dey work?",
                `Oya ${waitingP.destStop} straight, make we move!`,
              ];
            }
            const bQuote = boardAlerts[Math.floor(Math.random() * boardAlerts.length)];
            this.triggerPassengerSpeech(bQuote, 'boarding', waitingP.destStop, 'New Commuter', '👋');

            this.callbacks.onToast(`Commuter boarding: 📍 To ${waitingP.destStop} · ₦${waitingP.farePrice}`);
          }
        }

        if (s.group.position.z > 14 && !s.missedDrop) {
          s.missedDrop = true;
          const missedList = this.passengersOnboard.filter(p => p.destStop === s.name);
          if (missedList.length > 0) {
            const missedAlerts = [
              "Driver! You don pass my stop o! Why you no drop me?!",
              "Ah ah, driver! I tell you say I dey drop o!!",
              "Driver reverse abeg! I dey drop o!!",
              `Chai! You don carry me pass ${s.name} o!`,
            ];
            const mQuote = missedAlerts[Math.floor(Math.random() * missedAlerts.length)];
            this.triggerPassengerSpeech(mQuote, 'missed', s.name, 'Angry Commuter', '😡');
            this.callbacks.onToast(`😡 Commuter: "${mQuote}"`);
          }
        }

        if (s.group.position.z > 14 && !s.missed) {
          s.missed = true;
          if (s.ppl.some(p => !p.walk)) {
            this.callbacks.onToast(`Missed commuters at ${s.name}!`);
          }
        }
      }

      // Walking passenger animation towards car
      for (let i = this.walkers.length - 1; i >= 0; i--) {
        const w = this.walkers[i];
        w.t = (w.t || 0) + dt * 2.2;
        const k = Math.min(1, w.t);
        w.position.x = (w.sx || 0) + (this.LX[0] - (w.sx || 0)) * k;
        w.position.z = (w.sz || 0) + (-w.s!.position.z - (w.sz || 0)) * k;
        w.lL.rotation.x = Math.sin(this.gameTime * 12) * 0.7;
        w.lR.rotation.x = -Math.sin(this.gameTime * 12) * 0.7;

        if (k >= 1) {
          w.s!.remove(w);
          this.walkers.splice(i, 1);
          const newPassenger: OnboardPassenger = {
            id: Math.random().toString(36).substring(2, 9),
            originStop: w.originStop || 'Bus Stop',
            destStop: w.destStop || 'Maitama Junction',
            fare: w.farePrice || this.vehicleCfg.fare,
            shirtColor: w.shirtColor || 0x2b6cd6,
            hasUmbrella: !!w.hasUmbrella,
          };
          this.passengersOnboard.push(newPassenger);
          this.riders = this.passengersOnboard.length;
          this.callbacks.onRidersChange(this.riders, this.vehicleCfg.cap);
          this.callbacks.onPassengersChange([...this.passengersOnboard], this.vehicleCfg.cap);
          this.updateOnboardPassengerMeshes();
        }
      }

      this.busStops = this.busStops.filter(s => {
        if (s.group.position.z > 40) {
          this.scene.remove(s.group);
          return false;
        }
        return true;
      });

      // Traffic spawner & physics
      this.trafficTimer -= dt;
      if (this.trafficTimer <= 0) {
        this.trafficTimer = Math.max(0.65, 1.6 - this.dist / 800) * (0.7 + Math.random() * 0.6);
        this.spawnTrafficCar();
      }

      for (let i = this.traffic.length - 1; i >= 0; i--) {
        const t = this.traffic[i];
        const g = t.group;
        g.position.z += (this.speed - t.speed) * dt;

        // Collision Check
        const distZ = Math.abs(g.position.z - this.player.position.x * 0);
        const distX = Math.abs(g.position.x - this.player.position.x);

        if (this.invulnerability <= 0 && distX < 1.65 && Math.abs(g.position.z) < (g.len + this.player.len) / 2) {
          this.lives--;
          this.invulnerability = 1.8;
          this.shakeAmount = 0.6;
          this.callbacks.onLivesChange(this.lives);
          sound.playCrash();

          const insults = [
            'Okada cut you off! Watch out!',
            'Bumper to bumper collision!',
            'Danfo overtaking menace!',
            'Kabu-kabu scratched your paint!',
          ];
          this.callbacks.onToast(insults[Math.floor(Math.random() * insults.length)]);

          this.scene.remove(g);
          this.traffic.splice(i, 1);

          if (this.lives <= 0) {
            this.handleGameOver();
            return;
          }
          continue;
        }

        if (g.position.z > 35 || g.position.z < -320) {
          this.scene.remove(g);
          this.traffic.splice(i, 1);
        }
      }
    }

    // Update Splash Particles
    for (let i = this.splashParticles.length - 1; i >= 0; i--) {
      const p = this.splashParticles[i];
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 9.8 * dt; // gravity

      if (p.life <= 0 || p.mesh.position.y < 0) {
        this.scene.remove(p.mesh);
        this.splashParticles.splice(i, 1);
      }
    }

    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  }

  private handleGameOver() {
    this.state = 'over';
    sound.stopAll();
    this.callbacks.onGameOver({
      money: this.money,
      dist: Math.round(this.dist),
      passengers: this.totalPassengersServed,
      puddles: this.puddlesSplashed,
      hawkers: this.hawkersGreeted,
    });
  }

  private updateCamera(dt: number) {
    this.shakeAmount = Math.max(0, this.shakeAmount - dt * 1.5);
    const shakeX = (Math.random() - 0.5) * this.shakeAmount * 0.8;
    const shakeY = (Math.random() - 0.5) * this.shakeAmount * 0.8;

    const px = this.player ? this.player.position.x : 0;

    if (this.cameraView === 'hood') {
      // First-person cockpit hood view
      const camY = this.vehicleKey === 'bus' ? 2.6 : this.vehicleKey === 'bike' ? 1.4 : 1.35;
      const camZ = this.vehicleKey === 'bus' ? -2.2 : this.vehicleKey === 'bike' ? 0.3 : -0.6;
      this.camera.position.set(px + shakeX, camY + shakeY, camZ);
      this.camera.lookAt(px * 0.9, camY * 0.85, -28);
    } else {
      // Third-person chase camera
      const camZ = this.vehicleKey === 'bus' ? 14 : 11;
      const camY = this.vehicleKey === 'bus' ? 6.2 : 5.1;
      this.camera.position.set(px * 0.5 + shakeX, camY + shakeY, camZ);
      this.camera.lookAt(px * 0.7, 1.6, -15);
    }
  }

  public resize() {
    if (!this.renderer || !this.camera) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  public startAnimation() {
    const loop = () => {
      this.update();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    sound.stopAll();
    this.renderer?.dispose();
  }
}

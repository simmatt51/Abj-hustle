/**
 * Type definitions for Abuja Hustle 3D
 */

import * as THREE from 'three';

export type VehicleKey = 'bike' | 'cab' | 'bus';

export type WeatherKey = 'sunny' | 'rain' | 'thunderstorm' | 'sunset' | 'night' | 'harmattan';

export interface VehicleConfig {
  name: string;
  desc: string;
  max: number;
  cap: number;
  fare: number;
  col: number;
  icon: string;
  handling: number;
  acceleration: number;
}

export interface WeatherPreset {
  key: WeatherKey;
  label: string;
  icon: string;
  skyColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  sunColor: number;
  sunIntensity: number;
  sunPos: [number, number, number];
  ambientColor: number;
  ambientIntensity: number;
  rainIntensity: number;
  dustIntensity: number;
  roadFriction: number;
  fareMultiplier: number;
  description: string;
  temp: string;
}

export interface TimeOfDayInfo {
  hours: number;
  timeString: string;
  periodLabel: string;
  icon: string;
  darkness: number;
  isNight: boolean;
  autoLightsActive: boolean;
}

export interface PuddleItem {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  lane: number;
  radius: number;
  active: boolean;
}

export interface HawkerItem {
  group: THREE.Group;
  x: number;
  z: number;
  type: 'suya' | 'water' | 'gala';
  honked: boolean;
  textMesh?: THREE.Sprite;
}

export interface OnboardPassenger {
  id: string;
  originStop: string;
  destStop: string;
  fare: number;
  shirtColor: number;
  hasUmbrella: boolean;
}

export interface PassengerSpeech {
  id: string;
  speakerName: string;
  avatarEmoji: string;
  destStop?: string;
  text: string;
  category: 'dropping' | 'boarding' | 'alighting' | 'missed' | 'ride';
  timestamp: number;
}

export interface LandmarkArch {
  group: THREE.Group;
  z: number;
  name: string;
  passed: boolean;
}

export interface GameScore {
  money: number;
  best: number;
  distance: number;
  passengersServed: number;
  puddlesSplashed: number;
  hawkersGreeted: number;
}

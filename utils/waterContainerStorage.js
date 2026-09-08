import { AsyncStorage } from 'expo-sqlite/kv-store';
import {
  DEFAULT_WATER_CONTAINERS,
  WATER_CONTAINERS_STORAGE_KEY,
} from '@/constants/dietConstants';

export async function getWaterContainers() {
  try {
    const raw = await AsyncStorage.getItem(WATER_CONTAINERS_STORAGE_KEY);
    if (!raw) return [...DEFAULT_WATER_CONTAINERS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...DEFAULT_WATER_CONTAINERS];
    }
    return parsed.filter(
      (item) => item && item.id && item.name && Number(item.volumeMl) > 0
    );
  } catch {
    return [...DEFAULT_WATER_CONTAINERS];
  }
}

export async function saveWaterContainers(containers) {
  await AsyncStorage.setItem(
    WATER_CONTAINERS_STORAGE_KEY,
    JSON.stringify(containers)
  );
}

export function findWaterContainer(containers, containerId) {
  if (!containerId || !Array.isArray(containers)) return null;
  return containers.find((c) => c.id === containerId) || null;
}

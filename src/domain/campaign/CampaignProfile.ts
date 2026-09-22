export interface CampaignStats {
  victories: number;
  deaths: number;
  totalPlayMs: number;
  highestLevel: number;
  highestHits: number;
  highestStage: number;
}

export interface SoundSettings {
  muted: boolean;
  volume: number;
}

export interface CampaignProfile {
  checkpointStage: number;
  checkpointSeed?: string;
  unlockedWeaponEvolutions: string[];
  stats: CampaignStats;
  sound: SoundSettings;
}

export const DEFAULT_CAMPAIGN_PROFILE: CampaignProfile = {
  checkpointStage: 1,
  unlockedWeaponEvolutions: [],
  stats: { victories: 0, deaths: 0, totalPlayMs: 0, highestLevel: 0, highestHits: 0, highestStage: 1 },
  sound: { muted: false, volume: 0.55 },
};

export function recordRun(
  profile: CampaignProfile,
  result: { survived: boolean; elapsedMs: number; level: number; hits: number; stage: number },
): CampaignProfile {
  const nextStage = result.survived ? result.stage + 1 : 1;
  return {
    ...profile,
    checkpointStage: nextStage,
    checkpointSeed: undefined,
    stats: {
      victories: profile.stats.victories + Number(result.survived),
      deaths: profile.stats.deaths + Number(!result.survived),
      totalPlayMs: profile.stats.totalPlayMs + result.elapsedMs,
      highestLevel: Math.max(profile.stats.highestLevel, result.level),
      highestHits: Math.max(profile.stats.highestHits, result.hits),
      highestStage: Math.max(profile.stats.highestStage, Math.min(2, result.stage + Number(result.survived))),
    },
  };
}

export function unlockWeaponEvolution(profile: CampaignProfile, weaponId: string, routeId: string): CampaignProfile {
  const key = `${weaponId}:${routeId}`;
  if (profile.unlockedWeaponEvolutions.includes(key)) return profile;
  return { ...profile, unlockedWeaponEvolutions: [...profile.unlockedWeaponEvolutions, key] };
}

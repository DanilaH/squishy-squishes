export const LIGHT_PRESETS = ['studio','soft','sunset','moon'] as const;
export type LightPreset = typeof LIGHT_PRESETS[number];
export interface CraftLight { readonly preset: LightPreset; readonly x: number; readonly y: number }
export const lightUniform = (light?: CraftLight): readonly [number,number,number,number] =>
  light ? [light.x, light.y, LIGHT_PRESETS.indexOf(light.preset), 1] : [0,0,0,0];
export const readCraftLight = (value: unknown): CraftLight => {
  if(typeof value!=='object'||value===null)throw new TypeError('Light settings are invalid.');
  const light=value as Record<string,unknown>;
  if(!LIGHT_PRESETS.includes(light.preset as LightPreset)||typeof light.x!=='number'||typeof light.y!=='number'||!Number.isFinite(light.x)||!Number.isFinite(light.y)||Math.abs(light.x)>1||Math.abs(light.y)>1)throw new TypeError('Light settings are invalid.');
  return {preset:light.preset as LightPreset,x:light.x,y:light.y};
};

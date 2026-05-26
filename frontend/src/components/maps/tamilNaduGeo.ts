/** Approximate district / taluk centroids for Tamil Nadu (WGS84). */

export interface LatLng {
  lat: number
  lng: number
}

export const TN_CENTER: LatLng = { lat: 11.1271, lng: 78.6569 }

/** District code → centroid (matches master_seed DISTRICTS). */
export const TN_DISTRICT_GEO: Record<string, LatLng> = {
  ARI: { lat: 11.14, lng: 79.08 },
  CHN: { lat: 13.0827, lng: 80.2707 },
  CGL: { lat: 12.6922, lng: 79.9788 },
  CBE: { lat: 11.0168, lng: 76.9558 },
  CDL: { lat: 11.7444, lng: 79.7683 },
  DHR: { lat: 12.1211, lng: 78.1582 },
  DDG: { lat: 10.3673, lng: 77.9803 },
  ERD: { lat: 11.341, lng: 77.7172 },
  KLK: { lat: 11.746, lng: 79.147 },
  KAN: { lat: 12.8342, lng: 79.7036 },
  KNY: { lat: 8.0883, lng: 77.5385 },
  KAR: { lat: 10.9601, lng: 78.0766 },
  KRI: { lat: 12.5186, lng: 78.2138 },
  MDU: { lat: 9.9252, lng: 78.1198 },
  MYL: { lat: 11.103, lng: 79.655 },
  NAG: { lat: 10.7652, lng: 79.8429 },
  NMK: { lat: 11.2194, lng: 78.1674 },
  NLG: { lat: 11.41, lng: 76.695 },
  PMB: { lat: 11.234, lng: 78.883 },
  PDK: { lat: 10.3833, lng: 78.8001 },
  RMD: { lat: 9.3639, lng: 78.8365 },
  RNP: { lat: 12.925, lng: 79.33 },
  SLM: { lat: 11.6643, lng: 78.146 },
  SVG: { lat: 9.8436, lng: 78.4809 },
  TJV: { lat: 10.787, lng: 79.1378 },
  THI: { lat: 10.0104, lng: 77.4768 },
  THV: { lat: 8.7642, lng: 78.1348 },
  TKS: { lat: 8.9559, lng: 77.3153 },
  TVL: { lat: 8.7139, lng: 77.7567 },
  TPT: { lat: 12.4962, lng: 78.5601 },
  TRP: { lat: 11.1085, lng: 77.3411 },
  TVR: { lat: 13.1377, lng: 79.9088 },
  TVM: { lat: 12.2253, lng: 79.0747 },
  TVA: { lat: 10.772, lng: 79.6368 },
  TRI: { lat: 10.7905, lng: 78.7047 },
  VLR: { lat: 12.9165, lng: 79.1325 },
  VLP: { lat: 11.9401, lng: 79.4861 },
  VDN: { lat: 9.568, lng: 77.9624 },
}

/** Coimbatore taluk codes (walkthrough demo). */
export const CBE_TALUK_GEO: Record<string, LatLng> = {
  CBE_CBE: { lat: 11.0168, lng: 76.9558 },
  CBE_MET: { lat: 11.3, lng: 76.935 },
  CBE_POL: { lat: 10.657, lng: 77.008 },
}

export function getDistrictGeo(code: string): LatLng | null {
  return TN_DISTRICT_GEO[code] ?? null
}

export function getTalukGeo(code: string, districtCode: string): LatLng | null {
  if (CBE_TALUK_GEO[code]) return CBE_TALUK_GEO[code]
  const district = getDistrictGeo(districtCode)
  return district
}

import talukIndexJson from '@cat-maps/tn-taluks-index.json'

export interface TalukOption {
  code: string
  name: string
}

interface TalukIndexDistrict {
  taluks: TalukOption[]
}

interface TalukIndex {
  districts: Record<string, TalukIndexDistrict>
}

const talukIndex = talukIndexJson as TalukIndex

/** Revenue taluks for a district (same source as the admin company form). */
export function taluksForDistrict(districtCode: string): TalukOption[] {
  if (!districtCode) return []
  return talukIndex.districts[districtCode]?.taluks ?? []
}

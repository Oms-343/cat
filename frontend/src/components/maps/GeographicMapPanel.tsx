import { GeographicChoroplethMap } from "./GeographicChoroplethMap";
import type { GeoDrillLevel } from "./geoTypes";
import type { MapRegion } from "./mapTypes";

export interface GeographicMapPanelProps {
  title: string;
  regions: MapRegion[];
  level: GeoDrillLevel;
  districtCode?: string;
  districtName?: string;
  hoveredCode: string | null;
  onHover: (code: string | null) => void;
  /** Fires when a district polygon is clicked. Always carries a district code. */
  onSelectDistrict: (code: string) => void;
  disableEmpty?: boolean;
}

/** Choropleth of Tamil Nadu's 38 districts, rendered from live OSM boundaries. */
export function GeographicMapPanel(props: GeographicMapPanelProps) {
  return <GeographicChoroplethMap {...props} />;
}

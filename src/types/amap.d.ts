/**
 * 高德地图 JS API 2.0 部分类型声明
 * 仅声明本项目中用到的接口
 */
declare namespace AMap {
  class Geocoder {
    constructor(opts?: { city?: string });
    getLocation(address: string, callback: (status: string, result: GeocoderResult) => void): void;
  }
  interface GeocoderResult {
    info: string;
    geocodes?: { location: LngLat; formattedAddress?: string }[];
  }
  class LngLat {
    constructor(lng: number, lat: number);
    getLng(): number;
    getLat(): number;
  }
  class Map {
    constructor(container: string | HTMLElement, opts?: MapOptions);
    setZoom(level: number): void;
    setCenter(center: LngLat | [number, number]): void;
    setFitView?: () => void;
    add(overlay: unknown): void;
    remove(overlay: unknown): void;
    destroy(): void;
  }
  interface MapOptions {
    zoom?: number;
    center?: [number, number];
    viewMode?: string;
  }
  class Polyline {
    constructor(opts?: { path?: number[][]; strokeColor?: string; strokeWeight?: number });
  }
  class Marker {
    constructor(opts?: { position: [number, number] | LngLat; title?: string });
  }
  function plugin(plugins: string[], callback: () => void): void;
}

declare const AMap: {
  Geocoder: typeof AMap.Geocoder;
  Map: typeof AMap.Map;
  Polyline: typeof AMap.Polyline;
  Marker: typeof AMap.Marker;
  LngLat: typeof AMap.LngLat;
  plugin: typeof AMap.plugin;
};

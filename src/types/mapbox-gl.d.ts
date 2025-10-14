/**
 * Additional Mapbox GL types for TypeScript
 */

declare module 'mapbox-gl' {
  export interface MapboxOptions {
    container: string | HTMLElement;
    style: string;
    center?: [number, number];
    zoom?: number;
    accessToken?: string;
  }
}

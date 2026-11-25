// Types for @topodot/maplibre-gl-photosphere (hand-written; the package ships plain ES modules).
import type { Map as MapLibreMap } from 'maplibre-gl';

export type LngLatPair = [number, number];
export type Rgb = [number, number, number];
export type NavId = string | number;
export type PhotosphereMode = 'outside' | 'entering' | 'inside' | 'exiting';

/** Panoramax-style tiled HD derivate of a panorama. */
export interface TilesConfig {
    /** Full panorama width in px (height = width / 2). */
    width: number;
    cols: number;
    rows: number;
    url: (col: number, row: number) => string | null | undefined;
}

/** A panorama to enter or walk to. Extra fields are passed back to onMove. */
export interface PanoTarget {
    lngLat?: LngLatPair;
    imageUrl?: string;
    /** World azimuth (deg) to face on arrival. */
    bearing?: number;
    /** World azimuth (deg) the image centre faces; defaults to bearing. */
    panoYaw?: number;
    /** Capture tilt (deg) to undo. */
    panoPitch?: number;
    /** Capture roll (deg) to undo. */
    panoRoll?: number;
    tiles?: TilesConfig;
    projection?: 'equirectangular' | 'flat';
    /** Horizontal FOV (deg) of a flat picture. */
    hfov?: number;
    /** Vertical FOV (deg) of a flat picture; derived from the image aspect when omitted. */
    vfov?: number;
    [key: string]: unknown;
}

export interface ArrowStyle {
    /** Fill, [r, g, b] 0..1. Default white. */
    color: Rgb;
    /** Rim, [r, g, b] 0..1. Default white. */
    edgeColor: Rgb;
    /** Rim width on the ground (m); 0 = no rim. Default 0. */
    edgeWidth: number;
    /** Arrowhead scale. Default 1. */
    size: number;
    /** Ground distance from the eye (m). Default 5. */
    distance: number;
}

export interface ExitView {
    center: LngLatPair;
    zoom: number;
    pitch: number;
    bearing: number;
}

export interface PhotosphereOptions {
    lngLat: LngLatPair;
    imageUrl: string;
    tiles?: TilesConfig;
    /** Metres above ground while inside. Default 1.6. */
    eyeHeight?: number;
    /** Map zoom while inside. Default 18. */
    zoom?: number;
    /** Sphere radius in metres (parallax while entering). Default 6. */
    radius?: number;
    /** Enter/exit transition length (ms). Default 1500. */
    durationMs?: number;
    /** goTo() walk length (ms). Default 650. */
    walkMs?: number;
    /** Degrees per pixel dragged. Default 0.15. */
    dragSensitivity?: number;
    /** Look-pitch limits inside (deg). Defaults -85 / 85. */
    minPitch?: number;
    maxPitch?: number;
    /** Vertical field of view (deg). Default 75. */
    fov?: number;
    /** Mouse wheel zooms the FOV while inside. Default true. */
    scrollZoom?: boolean;
    /** FOV degrees per wheel notch. Default 4. */
    scrollZoomStep?: number;
    arrowStyle?: Partial<ArrowStyle>;
    /** View to return to on exit(); defaults to a view of the last anchor. */
    exitView?: ExitView;
    projection?: 'equirectangular' | 'flat';
    hfov?: number;
    vfov?: number;
    onEnter?: () => void;
    onExit?: () => void;
    onMove?: (target: PanoTarget) => void;
}

export interface NavArrow {
    /** World azimuth (deg) toward the target. */
    bearing: number;
    id: NavId;
}

export interface NavPoi {
    /** Ground offset from the eye (m). */
    east: number;
    north: number;
    id: NavId;
    color?: Rgb;
}

export interface PanoPose {
    yaw: number;
    pitch: number;
    roll: number;
}

export interface PoseEditDragInfo {
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    shiftKey: boolean;
}

export class Photosphere {
    constructor(map: MapLibreMap, options: PhotosphereOptions);

    readonly mode: PhotosphereMode;
    readonly lngLat: LngLatPair;
    readonly yaw: number;
    readonly pitch: number;
    /** True while goTo() is walking between two panoramas. */
    readonly transitioning: boolean;
    /** Current vertical field of view (deg). */
    readonly fov: number;

    /** Download and decode a panorama ahead of enter()/goTo() (keeps the 2 most recent). */
    preload(url: string): void;
    /** Resolves once the current panorama is on the GPU; rejects if it fails to load or on remove(). */
    whenReady(): Promise<void>;
    enter(target?: PanoTarget): void;
    goTo(target: PanoTarget): void;
    exit(): void;
    remove(): void;

    blend(alpha: number): void;
    look(deltaYawDeg: number, deltaPitchDeg: number): void;
    zoomFov(deltaDeg: number): void;

    setNavArrows(list: ReadonlyArray<NavArrow>): void;
    setNavPois(list: ReadonlyArray<NavPoi>): void;
    setArrowStyle(style?: Partial<ArrowStyle>): void;
    /** Id of the arrow or dot under a canvas pixel, or null. */
    groundPick(px: number, py: number): NavId | null;
    /** Ground point (east, north) metres from the eye under a canvas pixel, or null above the horizon. */
    groundPointAt(px: number, py: number): [number, number] | null;

    setPanoPose(pose?: Partial<PanoPose>): void;
    getPanoPose(): PanoPose;
    setPoseEditDrag(callback: ((dxDeg: number, dyDeg: number, info: PoseEditDragInfo) => void) | null): void;
    setAnchor(lngLat?: LngLatPair, eyeHeight?: number): void;
}

export function normalizeYaw(deg: number): number;
/** Column-major world→camera rotation of a capture pose. */
export function panoPoseMatrix(yawDeg: number, pitchDeg?: number, rollDeg?: number): number[];
export function poseTransform(m: ArrayLike<number>, v: ArrayLike<number>): [number, number, number];
export function flatTanHalf(
    flat: boolean,
    hfovDeg?: number,
    vfovDeg?: number | null,
    image?: { width: number; height: number } | null,
): [number, number];
export function flatUV(
    dir: ArrayLike<number>,
    m: ArrayLike<number>,
    tanHalfH: number,
    tanHalfV: number,
): [number, number] | null;

export interface VisibleTilesView {
    yawDeg: number;
    pitchDeg: number;
    panoYawDeg?: number;
    panoRot?: ArrayLike<number> | null;
    fovDeg: number;
    aspect: number;
    cols: number;
    rows: number;
    samples?: number;
    marginNdc?: number;
}

export function visibleTiles(view: VisibleTilesView): Array<{ col: number; row: number; priority: number }>;

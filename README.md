# @topodot/maplibre-gl-photosphere

[![license](https://img.shields.io/badge/license-BSD--3--Clause-blue)](LICENSE)

> **Fork notice.** This is a fork of
> [maplibre-gl-photosphere](https://github.com/clement-igonet/maplibre-gl-photosphere)
> 0.5.0 by Clement IGONET, distributed under the same BSD 3-Clause license
> (see [LICENSE](LICENSE)). It is not endorsed by the original author.
> Changes in this fork are listed in [CHANGELOG.md](CHANGELOG.md) under 1.0.0:
> configurable arrow style, `preload()` with off-main-thread decoding (large
> panoramas no longer freeze each step), scroll-wheel FOV zoom,
> `transitioning` / `fov` getters, TypeScript types, and fixes to the
> enter/exit animations. The demos and sections below are upstream's.

Step off the map, into the street. An immersive 360° photosphere plugin for
[MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js)
(issue [maplibre-gl-js#4428](https://github.com/maplibre/maplibre-gl-js/issues/4428)):
the panorama is rendered **inside** the map — one camera, one projection — so
vector layers blend into the photo, navigation arrows lie on the actual street,
and walking to the next panorama is a continuous move, not a teleport.

No three.js. No dependencies. One custom layer, one fragment shader.

## 🎬 Try it (30 seconds)

**[▶ Street View demo](https://clement-igonet.github.io/maplibre-gl-photosphere/docs/street-view.html)** —
a real [Panoramax](https://panoramax.fr) sequence in Paris:

1. Click a point on the blue route — the camera flies down to eye level as the
   photo fades in around you.
2. Drag to look around — **HD tiles sharpen exactly where you look**.
3. Click the white arrow (or blue dot) on the street to walk forward —
   Street-View-style dolly, no hard cut.

**[▶ Minimal demo](https://clement-igonet.github.io/maplibre-gl-photosphere/docs/)** —
one panorama, one `enter()` call, view-source-friendly.

## Install

```sh
npm install @topodot/maplibre-gl-photosphere
```

```js
import {Photosphere} from '@topodot/maplibre-gl-photosphere';

const photosphere = new Photosphere(map, {
    lngLat, imageUrl,
    // Fork additions (all optional):
    arrowStyle: {color: [0.18, 0.6, 0.81], edgeColor: [1, 1, 1], edgeWidth: 0.12, size: 0.6, distance: 6},
    scrollZoom: true,               // wheel zooms the FOV while inside (default)
    scrollZoomStep: 4               // FOV degrees per wheel notch (default)
});

photosphere.preload(nextPano.imageUrl); // decode the next/previous pano ahead of goTo()
photosphere.setArrowStyle({size: 0.8}); // change any arrow field at runtime
photosphere.transitioning;              // true while goTo() walks
photosphere.fov;                        // current vertical FOV (deg)
```

Or without a bundler — it's plain ES modules:

```html
<script type="importmap">
    {
        "imports": {
            "maplibre-gl": "https://esm.sh/maplibre-gl@5",
            "maplibre-gl-photosphere": "https://unpkg.com/maplibre-gl-photosphere/src/index.js"
        }
    }
</script>
```

## Quick start

```js
import {Photosphere} from 'maplibre-gl-photosphere';

const map = new maplibregl.Map({
    container: 'map',
    style: yourStyle,
    minPitch: 5,
    maxPitch: 175,                  // the eye must be able to look level
    centerClampedToGround: false    // ...from eye height above the ground
});

const photosphere = new Photosphere(map, {
    lngLat: [2.286828, 48.856625],
    imageUrl: 'panorama.jpg',       // equirectangular 360° image
    onEnter: () => console.log('inside'),
    onExit: () => console.log('back on the map')
});

photosphere.enter();                // fly in
photosphere.exit();                 // fly back out
```

## Street-View navigation

`enter(target)` and `goTo(target)` take a panorama descriptor, so a sequence of
geolocated pictures becomes a walkable street:

```js
const pano = {
    lngLat: [lng, lat],
    imageUrl: 'sd.jpg',
    bearing: 143,                   // world azimuth to face on arrival
    tiles: {…}                      // optional HD refinement, see below
};

photosphere.enter(pano);            // step in here
photosphere.goTo(nextPano);         // walk there: preload + dolly + crossfade

// Draw navigation on the street itself (in-shader — never clipped, any pitch):
photosphere.setNavArrows([{bearing: 143, id: 'next'}]);          // walk arrows
photosphere.setNavPois([{east: 3.1, north: 9.4, id: 'next'}]);   // floor dots (m from eye)
photosphere.groundPick(px, py);     // which arrow/dot is under this pixel?
```

## Progressive HD tiles

Panoramax-style tiled derivates refine the panorama in place: the base
`imageUrl` shows instantly, then the tiles visible from the current camera
stream in, most-central first, as you look around.

```js
photosphere.enter({
    lngLat, imageUrl, bearing,
    tiles: {
        width: 5640,                // full panorama width in px (height = width / 2)
        cols: 8, rows: 4,           // tile grid
        url: (col, row) => `…/tiled/${col}_${row}.jpg`
    }
});
```

The texture becomes a full-panorama atlas (capped by the GPU's
`MAX_TEXTURE_SIZE`, tiles downscale beyond it) seeded with the base image, and
tiles `texSubImage2D` into it — the shader still samples one equirectangular
texture, so blending, transitions and ground overlays are unaffected. The
visible-tile maths (seam wrap, pole rows, angle-based priority) is exported as
[`visibleTiles()`](src/tiles.js), pure and testable without WebGL.
With Panoramax, build this straight from the STAC item's
`tiles:tile_matrix_sets` + `asset_templates` fields — see
[docs/street-view.html](docs/street-view.html) for the ten lines.

## Mix photo and vector

Because photo and map share one camera, you can dial the photo's opacity and
let the vector world (3D buildings, roads, labels) shine through — aligned
with reality:

```js
photosphere.blend(0.5);             // 1 = photo only … 0 = vector only
photosphere.look(5, 0);             // keyboard-style look (deg yaw, pitch)
photosphere.zoomFov(-5);            // FOV zoom (wheel / pinch built in too)
```

## API

| method | |
|---|---|
| `enter(target?)` | fly in (optionally retargeting to a panorama descriptor) |
| `goTo(target)` | walk to an adjacent panorama with a smooth transition |
| `exit()` | fly back to the map (`exitView` or the last outside view) |
| `blend(alpha)` | steady-state photo opacity over the vector layers |
| `look(dYaw, dPitch)` / `zoomFov(dDeg)` | programmatic look / FOV zoom |
| `setNavArrows(list)` / `setNavPois(list)` | ground arrows / neighbour dots |
| `groundPick(px, py)` | id of the arrow/dot under a screen pixel, or `null` |
| `setPanoPose({yaw, pitch, roll})` / `getPanoPose()` | live capture-pose rendering (0.4.0) |
| `setPoseEditDrag(cb)` | neutral hook: route canvas drags to external tools (0.4.0) |
| `groundPointAt(px, py)` | floor raycast → (east, north) metres, or `null` (0.4.0) |
| `setAnchor(lngLat, eyeHeight?)` | re-anchor the current panorama in place (0.4.0) |
| `mode` / `yaw` / `pitch` / `lngLat` | current state (getters) |
| `remove()` | detach the layer and listeners |

Targets for `enter()`/`goTo()` accept `panoPitch`/`panoRoll` (degrees) next to
`panoYaw` — the plugin *renders* corrected poses from any imagery source, but
deliberately ships **no editor**: gesture algebra and write-back live in
[maplibre-gl-panoramax](https://github.com/clement-igonet/maplibre-gl-panoramax).

### Options

| option | default | |
|---|---|---|
| `lngLat` | required | anchor point of the panorama |
| `imageUrl` | required | spherical (equirectangular) panorama image |
| `tiles` | | tiled HD derivate for progressive refinement |
| `eyeHeight` | `1.6` | metres above ground while inside |
| `zoom` | `18` | map zoom while inside |
| `radius` | `6` | sphere radius in metres (parallax while entering) |
| `durationMs` | `1500` | enter/exit transition length |
| `walkMs` | `650` | goTo() walk transition length |
| `dragSensitivity` | `0.15` | degrees per pixel dragged |
| `minPitch` / `maxPitch` | `-85` / `85` | look-pitch limits inside |
| `fov` | `75` | vertical field of view in degrees |
| `exitView` | last outside view | `{center, zoom, pitch, bearing}` to return to |
| `onEnter` / `onExit` / `onMove` | | callbacks |

## How it works

The panorama is a `CustomLayerInterface` shader: each screen pixel is ray-cast
(from the current yaw/pitch/FOV) against the photosphere modeled as a finite
sphere and samples the equirectangular texture. There is no 3D mesh. While
entering, the eye is still outside the sphere's center, so the ray-sphere
intersection gives real parallax; at the center it reduces to plain direction
sampling.

While inside, the camera is driven through the public
`map.calculateCameraOptionsFromTo()` API so the eye stays pinned at exactly
the anchor point and eye height; looking around only rotates the view — which
is what keeps photo and vector locked together at any FOV.

## Development

```sh
npm ci
npm test                        # vitest suite
npm publish                     # publishes @topodot/maplibre-gl-photosphere (public)
```

`docker-compose.yml` still offers upstream's containerized `test` and `web`
(demo preview) services.

Upstream (by Clement IGONET) is used in the wild by
[MapMax](https://github.com/clement-igonet/mapmax), a Panoramax street-view app.

## License

BSD-3-Clause. Copyright (c) 2026, Clement IGONET; see [LICENSE](LICENSE).

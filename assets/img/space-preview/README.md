# Planetary Website Preview

Local preview only. The production website and GitHub README are unchanged.

- Entry: `index-space-preview.html`.
- Detail page: `research-space-preview.html`.
- Select Lunar Orbit or Mars Surface in the header, then use the sun/moon button.
- Scene and theme are preserved across the two preview pages, separately from the production site's settings.
- Lunar Orbit uses the user's selected near-Moon / distant-Earth illustration in both UI themes. Light mode changes the reading surface rather than pretending space becomes a daytime blue sky.
- Mars Surface switches matching day and night illustrations. Portrait assets are selected by viewport aspect ratio.
- Production assets and content have not been replaced; these are separate HTML, CSS, JS and image files.

## Image Generation

Built-in `image_gen` was used. No CLI/API fallback. PNG originals were copied without visual edits. The selected lunar image is retained from the previous preview. These are artistic illustrations with a distance hierarchy, not date-specific astronomical sky maps.

| Asset | Source |
| --- | --- |
| lunar-orbit.png | exec-896802c3-3981-497b-8b11-7ed6ba0bfe03.png, selected previous version |
| mars-day.png | exec-f3e99776-5942-44bd-ba83-5d9feab1875d.png |
| mars-night.png | exec-95777a23-e3d1-496f-8f3d-0e452adc8d03.png |
| lunar-mobile.png | exec-39207b15-7a57-4c0b-937d-46bcfb7d59f2.png |
| mars-day-mobile.png | exec-13c0dd1c-0cbb-4a59-a1ca-79f3b3bfe8ab.png |
| mars-night-mobile.png | exec-dff8f177-7adf-4f1b-87ae-b3c5a3ac874b.png |

## Prompts

### Mars Surface / Day

Edit Image 1 into the LIGHT / DAY companion of the same quiet Martian-surface illustrated website background. The image is a wide 16:9 canvas with softly hand-painted gouache rock texture, mineral strata, low canyon ridges on the outside lower corners, and a spacious sky.
Preserve the exact foreground canyon shapes, ground geometry and framing. Change only illumination and sky: a gently sunlit Martian late afternoon, low-intensity warm terracotta and dusty rose terrain, pale warm grey / muted apricot dust sky with a subtle cool blue-grey patch near the distant horizon. Sky should remain beautifully restrained, airy and smooth, not saturated orange, and fill the upper 70-75%. Preserve legible and delicate mineral textures in the foreground instead of washing them white. This is an atmospheric planetary landscape, not Earth desert stock photography.
There should be NO visible Earth or giant planets in the Martian sky, NO Moon hanging nearby, NO large star points in daylight, and NO sun flare. Put the valley and low central horizon in the bottom quarter, leaving the entire upper-middle uncluttered for an academic website.
Materials and style: illustrated geological strata, softly faceted forms, fine paper texture, natural side lighting, same elegant restrained painting language as the reference. Not photorealistic, not glossy 3D, not a sci-fi poster.
No astronaut, spacecraft, rover, rocket, telescope, vegetation, water, ice, clouds resembling Earth cumulus, buildings, labels, text, orbit lines, borders, UI panels, fantasy fog, neon, decorative blobs or bokeh. ONE full-bleed landscape background, not a sheet of variations.

### Mars Surface / Night

Use Image 1 as the EDIT TARGET: create the exact NIGHT counterpart of this Martian-surface website background. Preserve every canyon, ridge, rock silhouette, horizon shape and camera position. Preserve the soft hand-painted gouache texture.
Change only the time and illumination. The upper 75% should be vast charcoal-black and very subtly cool interplanetary sky, richer and deeper than dusk, with a natural moderately populated star field of tiny irregular white pinpoints and a few faint warm or cool points. No big starbursts, no obvious Milky Way stripe or dramatic nebula. The central sky must remain dark and quiet for webpage text.
The bottom quarter remains recognizably Mars: its mineral copper / mauve-grey terrain is softly lit by very faint night illumination, subdued but legible, with delicate strata and long gentle shadows. Retain a very dim cool-grey / mauve horizon, no bright sunset band, no orange glowing mountains. No changes to the topography. The entire scene should feel still and spacious as though standing on Mars and looking into deep space.
No Earth or Moon visible as a large globe; no nearby planets. No humans, rovers, rockets, buildings, satellite, probes, text, labels, orbit lines, panels, UI, borders, aurora, terrestrial clouds, water, ice, foliage, bokeh, or artificial spotlights. One wide 16:9 full-bleed illustration, not a comparison.

### Lunar Orbit / Mobile

Adapt Image 1 into a tall PORTRAIT 9:16 smartphone website background. Image 1 is the edit target and style reference. Keep the same beautiful gently hand-painted lunar crater surface, dark charcoal interplanetary space, subtle watercolor grain, and natural star points.
Recompose for a vertical screen rather than cutting out a narrow strip: the nearby lunar limb enters from the lower-left corner and remains within the bottom 25-30% of the portrait, leaving almost all the central vertical column dark and clear for text. A SMALL DISTANT EARTH sits in the upper-right quadrant, safely inside the frame around 73% of the width and 17% of height; Earth should be only 4% of the portrait width with muted blue oceans and white clouds. Earth is far away, not a giant neighbor. Eliminate the source's small orange spherical dot: any Mars suggestion must just be a pinpoint star, not an orange disk.
Retain a moderate number of tiny fine stars, naturally scattered, center restrained, peripheral stars slightly more visible. Crisp lunar rim and subdued silver terrain. No giant moons or planets, orbital lines, neon clouds, flares, aurora, bokeh, people, spacecraft, rovers, labels, words, UI, borders or watermark.
One complete tall portrait illustration, not a phone mockup or comparison sheet.

### Mars Surface / Day / Mobile

Adapt the supplied sunlit Martian-surface gouache illustration into ONE tall PORTRAIT 9:16 background for a mobile academic website. Image 1 is the edit target and style reference.
Preserve the quiet pale dusty apricot-grey Martian sky, softly faceted terracotta / mauve mineral strata and understated painting texture. Recompose rather than crop: low canyon ridges on both lower peripheral edges, foreground rock forms only along the bottom 20-25%, a shallow distant central valley. Keep the upper 75% calm, spacious, low-contrast and uncluttered. It must feel like standing on Mars and looking upward into the open sky.
No giant planet or nearby Moon, Earth or other celestial globe in this sky; no bright daytime stars, no Sun disk or flare, no clouds like Earth's. Preserve natural restrained color and not a uniformly orange filter.
No rover, rockets, people, spacecraft, buildings, vegetation, water, ice, letters, captions, logo, border, UI, mockup or multiple panels. One complete tall portrait illustration.

### Mars Surface / Night / Mobile

Edit Image 1 into the exact NIGHT counterpart of the tall portrait Martian mobile background. Keep the vertical 9:16 framing, all canyon silhouettes, rocks, strata, ground and horizon in exactly the same positions. Preserve the elegant hand-painted gouache style and grain.
Only change time and light: a dark charcoal / subtly cool-black open sky filling the upper 75%, moderately populated with tiny natural irregular stars, faint varied white points, no large crosses, no bright galaxy stripe or colorful nebula. Keep the central column quiet for webpage text. Ground becomes muted copper-grey and mauve shadow, subdued but still with readable geological detail, a dim cool horizon, no bright sunset band. This should feel like standing on Mars under deep space.
No giant Earth, Moon or nearby planets. No rover, people, rockets, spacecraft, buildings, plants, water, ice, terrestrial clouds, aurora, decorative glows or bokeh. No text, logo, border, UI or phone mockup. One complete portrait illustration.

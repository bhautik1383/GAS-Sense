# GasSense: Smart LPG Cylinder Monitoring, 3D Virtual Prototype

A conceptual, interactive 3D prototype (React + Vite + Three.js). Everything is simulated: the hardware is not built, calibrated or tested, and no real sensor is used.

## Run on Windows (PowerShell)
Install Node.js LTS from https://nodejs.org first, then:

    cd path\to\gassense-3d-prototype
    npm install
    npm run dev

The browser opens at http://localhost:5173 . Build a static copy with `npm run build`.

## What is inside
- Overview, 3D Studio (orbit, zoom, camera presets, exploded / internal / assembly views, component info), Dashboard, Architecture, Simulation Lab, Documentation, and a Presentation mode (Next / Previous, with a presenter note for each step).
- The model is built from Three.js geometry. No external assets or network are needed after install.
- Simulation: mass = capacity x level / 100; weight = tare + mass; days = mass / daily use. Low Gas at 30% or below, Critical at 10% or below (Critical wins). Tare (15 kg), capacity (14.2 kg) and use (0.4 kg/day) are illustrative and editable.

## Limits
- The level bar next to the cylinder is explanatory only. There is no internal fill cutaway, because the sensor measures weight, not the gas inside.
- No backend exists. The architecture page shows the proposed design only.

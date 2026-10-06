# Minecraft Sphere Layer Builder

A lightweight, local browser tool for building Minecraft spheres one horizontal layer at a time.

## Features

- Hollow and filled voxel spheres from 3 to 200 blocks in diameter
- Consistent odd- and even-diameter coordinate handling
- Center-to-top layer navigation with mirrored bottom coordinates
- Interactive X/Z grid with zoom, scrolling, and adjacent-layer overlay
- Cardinal edge coordinates and exact coordinates for selected cells
- Build-row coordinate ranges along either the X or Z axis
- Per-layer, upper-half, and whole-sphere block counts
- Responsive layout for desktop, tablet, and phone use

## Run

Open `index.html` in a modern browser. No install, server, or build step is required.

Enter the diameter and center coordinates, choose hollow or filled, and select **Generate sphere**. Use the on-screen controls or the Up/Down arrow keys to move between layers.

## Test

With Node.js installed:

```sh
node sphere.test.js
```

## Even-diameter convention

For odd diameters, the entered X/Y/Z is the sphere's geometric center block. For even diameters, the geometric center is half a block in the positive direction on every axis (`X + 0.5`, `Y + 0.5`, `Z + 0.5`). The entered coordinate is therefore the west/lower/north member of the central block group. The upper-half guide begins at `center Y + 1` and mirrors its first layer to `center Y`.

# 3D Interactive Rubik's Cube Solver

This project is a web-based 3D Rubik's Cube application built using **JavaScript** and the **Three.js** library. It features a fully functional physics-like interaction model, quaternion-based rotation logic to prevent gimbal lock, and an automated move-reversal solver.

## File Structure

The project is organized into three distinct modules to separate concerns:

### 1. `index.html` (Structure)
- **Role:** Sets up the DOM structure and imports external libraries.
- **Key Dependencies:**
  - Three.js (r128) via CDN for 3D rendering.
  - Tailwind CSS via CDN for rapid UI styling.
  - Google Fonts (Roboto Mono).
- **Function:** Contains the containers for the 3D canvas and the UI overlays (Controls, Status Indicator, Info Panel).

### 2. `style.css` (Presentation)
- **Role:** Manages the visual aesthetic of the user interface.
- **Key Features:**
  - Implements a "Dark Mode" aesthetic using semi-transparent, backdrop-filtered panels (glassmorphism).
  - Handles the absolute positioning of UI elements over the 3D canvas.
  - Defines animations for buttons and status indicators (Locked/Unlocked states).

### 3. `script.js` (Logic & 3D Engine)
- **Role:** Handles the entire 3D scene, game logic, and user input.
- **Key Components:**
  - **Scene Setup:** Lights, Camera, and Renderer configuration.
  - **Cube Generation:** Programmatically generates 27 individual "cubies" with specific face colors.
  - **Rotation Logic:** Uses **Quaternions** (not Euler angles) to handle rotations. This allows for complex compound rotations without "Gimbal Lock."
  - **Solver Algorithm:** Maintains a `history` stack of moves. The `solveCube` function reverses this stack and inverts the rotation direction to return the cube to its initial state.
  - **Interaction:**
    - **Mouse:** Raycasting/Vector mapping to rotate the entire cube group. Includes a custom "snap-to-grid" function to align the cube orthogonally when released.
    - **Keyboard:** Maps keys (U, D, L, R, F, B) to face rotation functions.

## How to Run

1. Simply open `index.html` in any modern web browser.
2. No local server or build step is required as libraries are loaded via CDN.

## Controls

- **Mouse Drag:** Rotate the view (Camera/Cube orientation).
- **Keyboard:**
  - `U`: Up Face
  - `D`: Down Face
  - `L`: Left Face
  - `R`: Right Face
  - `F`: Front Face
  - `B`: Back Face
  - Hold `Shift` + Key to rotate Counter-Clockwise.
- **UI Buttons:** Scramble the cube or auto-solve it.

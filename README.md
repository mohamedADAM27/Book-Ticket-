# Book Tickets - Connected Digital Transit Ledger & Card System

An administrative and passenger digital terminal for purchasing bus tickets, issuing recurring bus passes, verifying security QR cards, and simulating real-time system performance under microservice container scaling.

Designed for modern urban transit grids, **Book Tickets** binds real-time database transactions with passenger safety operations, combining client-side interactive graphics with express telemetry API relays.

---

## 🚀 Key Architectural Modules

### 1. Unified Passenger Dashboard
* **Dynamic Analytics**: Real-time calculations mapping active bus passes, accumulated travel loyalty, and dynamic transaction history.
* **Imminent Departure Alerts**: Automated detection scanner querying server databases for scheduled passenger boarding passes valid within the next 24 hours. Features instant shortcut linkages to target QR boarding keys.

### 2. High-Density Vector Ticket Booking
* **Interactive Luxury Seating Layout**: Grid diagram mapped with interactive buttons supporting active state choices, real-time responsive seat-allotments (Aisle vs. Window), and pre-occupied seats (mapping locked nodes).
* **Smart Tariffs**: Auto-recalculates fares based on route variables combined with a luxury upgrade (+₹50) mapped to Row 1 premium seats.
* **Regulated Secure Payment Handshake**: Simulates complete SSL/TLS security tunnels, PCI card checks (detecting 16-digit compliance structures), and cryptographic UPI signature handshakes safely cleared of distracting formatting symbols.

### 3. Digitally Signed Travel Passes
* **Tiered Subscription Architecture**: Supports passenger tiering (Student, Senior, General Public, and Corporate Welfare) containing calculated valid parameters.
* **Welfare Grants Verification**: Checks special coupon credentials to clear fees using state allocation indices.

### 4. Conductor Security QR Scanner
* **Decentralized Ticket Verification**: Physical station scanner terminal mockup supporting instant ticket checking.
* **Live Database Mutations**: Directly updates server ledger values to label ticket hashes (`valid` → `already used`), preventing duplicate boarding passes and validating credential integrity.

### 5. Google Cloud Stackdriver Console Simulator
* **Live System Telemetry**: Displays CPU loads, request throughput, and auto-scaling events based on live web actions.
* **Synchronized Stdout Logger Feed**: Simulates a live Stackdriver logging system streaming clean server events dynamically, color-coded by alert severity (Normal, Informational, Warning, Critical Service Outages).

---

## 🛠️ Stack Components

* **Frontend Engine**: React 18+ (using Vite build environment for highly responsive interactions).
* **Animation Matrix**: Motion (`motion/react`) driving staggered entrance animations and smooth modal state handshakes.
* **Tailwind CSS Utility Design**: Pure CSS sizing using custom, high-contrast, eye-safe typography elements ("Space Grotesk" for display headings / "JetBrains Mono" for system telemetry details).
* **Backend Pipeline**: Full-stack Node.js + Express API handlers enabling true data sharing across modules instead of isolated state arrays.

---

## 📖 Local Installation & Launch

Ensure you have [Node.js](https://nodejs.org/) installed on your regional development device.

### 1. Download & Prepare Repository
```bash
git clone https://github.com/your-username/book-tickets.git
cd book-tickets
```

### 2. Install Project Dependencies
Run the standard package synchronization tool to compile modules:
```bash
npm install
```

### 3. Open Development Host Server
Boot the live TS dev execution runner to access port `3000`:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your local web browser.

---

## 📦 Production Compiles & Delivery

To package and preview the compiled full-stack architecture inside containers or production VMs:

### 1. Build Production Assets
Compiles the static client interface via Vite and builds the Express server into a self-contained CommonJS target (`dist/server.cjs`) using `esbuild` for ultra-fast startup performance:
```bash
npm run build
```

### 2. Launch Standalone Build
```bash
npm run start
```
The server will bind to the active host address on Port `3000`.

---

## 📂 Project Directory Structure

```text
├── server.ts              # Full-stack backend Express API endpoints and Vite middleware routing
├── metadata.json          # App name, description, and frame capabilities variables
├── index.html             # Main index template layout
├── src/
│   ├── App.tsx            # Root application tab navigation and state management
│   ├── main.tsx           # Entry point index execution module
│   ├── index.css          # Global styles injecting custom Google Font family properties
│   ├── types.ts           # Unified TypeScript interfaces for routes, passes, and tickets
│   └── components/
│       ├── Dashboard.tsx  # Dynamic dashboard displaying passenger metrics and imminent departure notices
│       ├── TicketBooking.tsx # Advanced ticket booking wizard with luxury interactive seating grid
│       ├── BusPass.tsx    # Digital pass generation and subscription manager
│       ├── QRVerification.tsx # Conductor security scanning terminal with direct ticket ledger updates
│       ├── CloudMonitoring.tsx # Telemetry metrics analyzer and Cloud Logging feed simulator
│       └── QRCodeSVG.tsx  # Dense, high-density deterministic SVG generator with finder blocks
```

---

*Verified build on Google Cloud Run environments. Developed using strict human-centered design principles.*

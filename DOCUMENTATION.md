# Book Tickets System: Full End-to-End System Documentation

This documentation details the full system architecture, components, data flow pipelines, and execution procedures of the **Book Tickets** application.

---

## 🏛️ System Architecture Overview

The system is engineered as a full-stack Single-Page Application (SPA) utilizing a high-efficiency **Node.js + Express** server combined with a **Vite-driven React 18** client module. This ensures security and state consistency by proxying data changes through live APIs instead of keeping isolated client memory.

```text
┌────────────────────────────────────────────────────────┐
│                    REACT SPA CLIENT                    │
│   (Dashboard, Booking, Passes, QR Scanner, Admin UI)   │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
     REST State Sync                  Telemetry Ping
            ▼                                ▼
┌────────────────────────────────────────────────────────┐
│                  EXPRESS BACKEND ENGINE                │
│             (/api/* route routers & controllers)       │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
     Mutates Ledgers                  Fires Syslogs
            ▼                                ▼
┌─────────────────────────┐      ┌───────────────────────┐
│     IN-MEMORY STORE     │      │   CLOUD MONITORING    │
│  (Database Simulators)  │      │  Telemetry Logs Feed  │
└─────────────────────────┘      └───────────────────────┘
```

The system operates under a clear separation of concerns, executing server operations via standard REST paradigms and updating a central in-memory virtual relational database ledger.

---

## 🗄️ Unified Data Models (`/src/types.ts`)

Data is modeled with strict TypeScript definitions representing active transit parameters.

### 1. User Account Entity
```typescript
export interface User {
  uid: string;
  email: string;
  role: 'passenger' | 'admin';
  displayName?: string;
}
```

### 2. Physical Transit Route
```typescript
export interface Route {
  id: string;
  source: string;
  destination: string;
  fare: number;
  duration: string;
}
```

### 3. Dynamic Passenger Ticket
```typescript
export interface Ticket {
  id: string;           // Formatted as VERIFY_TKT_[UUID]
  user_id: string;
  route_id: string;
  seat_number: string;
  travel_date: string;
  booking_date: string; // ISO String
  fare_paid: number;
  status: 'valid' | 'already used' | 'expired';
}
```

### 4. Recurring Travel Pass
```typescript
export interface BusPass {
  id: string;           // Formatted as VERIFY_PASS_[UUID]
  user_id: string;
  user_name: string;
  pass_type: 'Student' | 'Senior' | 'General' | 'Welfare' | 'Corporate';
  expiry_date: string;  // ISO String
  issued_date: string;  // ISO String
  status: 'active' | 'suspended';
}
```

---

## 📡 Complete REST API Endpoint Specification

API endpoints are designed to handle strict querying capabilities based on active user parameters.

| HTTP Method | Endpoint | Request Query/Body | Functional Outcome |
|:---|:---|:---|:---|
| **GET** | `/api/routes` | None | Retrieves list of all registered bus routes. |
| **POST** | `/api/routes` | `{ source, destination, fare }` | Registers a new route in the administrator system. |
| **DELETE** | `/api/routes/:id` | Route ID (params) | Destroys an existing route configuration. |
| **GET** | `/api/tickets` | `?userId=[UID]` | Retrieves current passenger tickets. Admins get all records. |
| **POST** | `/api/tickets` | `{ routeId, seatNumber, travelDate, farePaid }` | Books a ticket, validates credentials, logs transition metrics. |
| **GET** | `/api/passes` | `?userId=[UID]` | Fetches active travel passes for a given passenger. |
| **POST** | `/api/passes` | `{ userName, passType, expiryMonths }` | Issues a custom long-duration bus pass. |
| **POST** | `/api/verify` | `{ qrCode }` | Verifies a ticket/pass scanning action, updates DB status. |
| **GET** | `/api/metrics` | None | Pulls current system load rates, memory indexes, API latency. |
| **GET** | `/api/logs` | None | Returns Stackdriver syslogs collected over the runtime session. |

---

## 📦 Dynamic Client-Side Component Structure

The React architecture is highly modular to prevent code delivery bloat.

### 1. `Dashboard.tsx`
* **Purpose**: Serves as the passenger's control page.
* **Key Features**:
  * Real-time counters showing trip counts, active passes, and transaction value.
  * **Imminent Departure Alerts**: Automatically monitors tickets for departures scheduled in the next 24 hours and presents a fast-access QR boarding link.

### 2. `TicketBooking.tsx`
* **Purpose**: Wizard allowing selection, layout checks, and secure checkouts.
* **Key Features**:
  * **Physical Grid Selector**: Dynamic SVG seat selector blocking occupied seats and applying premium price tiers (+₹50) to the first row of front cabinets.
  * **Regulated Secure Payment Handshake**: Multi-step terminal animating secure handshakes (contacting central gateway, authenticating virtual cards) without emojis, designed with high educational clarity.

### 3. `BusPass.tsx`
* **Purpose**: Terminal to purchase monthly, seasonal, or welfare transport passes.
* **Key Features**:
  * Validates age requirements for Senior discount credentials automatically.
  * Tracks pass expirations dynamically with high-contrast indicator highlights.

### 4. `QRVerification.tsx` (Conductor Scanning Terminal)
* **Purpose**: Simulates the bus conductor's scanner validating credentials on layout entrance.
* **Key Features**:
  * Fully styled in standard, secure clinical light templates with high-contrast text.
  * Inputting ticket/pass QR values instantly queries the database to flag previous usage (`valid` → `already used`), updating passenger tallies.

### 5. `CloudMonitoring.tsx` (Google Cloud Simulator)
* **Purpose**: Visualizes server infrastructure telemetry dynamically.
* **Key Features**:
  * Graphs illustrating dynamic CPU peaks, memory curves, request-per-second tallies, and autoscaling transitions.
  * Color-coded terminal system reproducing genuine Stackdriver diagnostic trails.

### 6. `AdminModule.tsx`
* **Purpose**: Admin dashboard tracking and overriding transit settings.
* **Key Features**:
  * Custom tools to append, modify, or eliminate available routes.
  * **Live Passenger Ledger Tables**: Instantly lists real-time passenger tickets, transit paths, and pass holders in synced databases.

### 7. `QRCodeSVG.tsx`
* **Purpose**: Micro-scale deterministic SVG generator drawing high-quality QR matrices.
* **Key Features**:
  * Creates clean grid patterns containing timing lines (Column 6/Row 6), 7x7 corner targets, and secondary alignment locks (5x5).
  * Uses vector overlap markers (`width={cellSize + 0.15}`) to prevent hairline gaps on heavy high-DPI screens.

---

## 🛡️ Live Verification Verification Flow

The QR verification workflow uses the following sequence to guarantee passenger safety:

```text
  [Conductor Scans QR Key]
             │
             ▼
   POST `/api/verify`
  { qrCode: "VERIFY_TKT_..." }
             │
             ▼
┌─────────────────────────┐
│     Database Query      │
└────────────┬────────────┘
             │
      ┌──────┴──────┐
     Found?        No  ──► [HTTP 404] "Signature not registered"
      │ Yes
      │
      ├───────────────────────┬───────────────────────┐
      ▼                       ▼                       ▼
 [Status: "already used"]  [Status: "expired"]   [Status: "valid"]
      │                       │                       │
      ▼                       ▼                       ▼
  [HTTP 200 SUCCESS]      [HTTP 200 SUCCESS]      [HTTP 200 SUCCESS]
 "Fraud Alert! Multi-    "Denied! Pass expired   "Access Approved! Welcome
   boarding detected"        on target date."       onboard the transit."
                                                      │
                                                      ▼
                                            Update DB Row status to
                                                "already used"
```

---

## 🎨 Visual Identity & Styling Paradigm

To represent a modern urban infrastructure utility, the UI uses the following visual patterns:

* **Primary Typography Hierarchy**: Set to **Inter** for responsive data values and interface buttons, paired with **Space Grotesk** for clean layout category banners.
* **Console Accent Styling**: Micro-size text headers rendered with **JetBrains Mono** font metrics for a clean operations feel.
* **Contrast Controls**: High-contrast, clean off-white design boards containing crisp borders (`border-slate-200`) and pure crimson active outlines (`border-[#991b1b]`).
* **Micro-state Transitions**: Uses soft focus effects (`focus:border-[#991b1b]` transitions) and responsive loading state spins to improve user confidence during actions.

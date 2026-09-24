# Real-Time Expert Session Booking System

A modern, responsive multi-page web application for discovering verified industry mentors, reserving real-time consultation slots, and managing 1:1 sessions.

---

## 🌟 Core Frontend Pages (Web Application)

The frontend is built using **React.js, Vite, Vanilla CSS, Lucide Icons, and Framer Motion**:

1. **Home / Landing Page (`/`)**
   - Hero banner with real-time availability metrics.
   - Interactive availability simulator card.
   - Domain category pills (IT & Cloud Architecture, Healthcare, Legal, Finance, EdTech).
   - 3-step consultation workflow pipeline.

2. **Search & Filter Providers (`/search`)**
   - Instant client-side search across mentor names, skills, and affiliations.
   - Domain category filters, experience dropdown, and price range slider.
   - Responsive expert cards with ratings, review counts, and direct booking links.

3. **Expert Profile & Slot Booking Studio (`/hub/:id`)**
   - Detailed mentor dossier, clinical/corporate credentials, and client reviews.
   - Consultation package selection (price and duration tiers).
   - Interactive calendar date picker.
   - Visual time slots with 3 distinct availability states (Available 🟢, Selected 🔵, Booked ⚪).
   - Client-side form validation (Full Name, Email, Phone, Agenda).
   - Instant confirmation pass with meeting room link and printable slip.

4. **Client Sessions Dashboard (`/dashboard`)**
   - Overview KPI summary cards (Total Bookings, Upcoming Sessions, Hours Mentored).
   - Status filter tabs: *All*, *Upcoming (Confirmed)*, *Completed*, *Cancelled*.
   - Direct 1-click **"Join Video Call"** button (Google Meet room).
   - Download pass slip and cancel/reschedule session controls with LocalStorage state persistence.

---

## 🛠️ Technology Stack

- **Frontend Library:** React.js (v19)
- **Build Tool:** Vite (v8)
- **Styling:** Vanilla CSS, CSS Variables, Glassmorphism & Flexbox/Grid
- **Icons & Motion:** Lucide React & Framer Motion
- **Routing:** React Router DOM (v7)
- **State & Storage:** Client-side LocalStorage state persistence and mock data store (`mockData.js`)

---

## 🚀 Getting Started

### 1. Run the Frontend Web Application
```bash
# Navigate to the web frontend directory
cd web

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 2. Build for Production
```bash
cd web
npm run build
npm run preview
```

---

## 📁 Repository Structure

```
├── web/                   # Frontend React Application
│   ├── src/
│   │   ├── components/    # Reusable UI components (Navbar, Modals, Cards)
│   │   ├── pages/         # 4 Core Pages (Landing, Search, Profile, Dashboard)
│   │   ├── context/       # Auth and state management
│   │   ├── data/          # Mock data store (verified experts, slots)
│   │   └── styles/        # Global stylesheet and variables
│   ├── public/            # Static icons and assets
│   ├── index.html         # Web application entry point
│   ├── package.json       # Dependencies and scripts
│   └── vite.config.js     # Vite bundler configuration
├── server/                # Backend API (Node.js & Express)
└── README.md              # Project documentation
```

---

## 📄 License
This project is licensed under the MIT License.

# ✦ ZOLARIUM

### Discover Madrid through your stars.

**Zolarium** is a full-stack Progressive Web App concept that combines astrology, Jungian archetypes, personalized recommendations, social discovery and virtual pet care into a single experience.

Instead of asking users *“What do you want to do?”*, Zolarium asks:

> **“What kind of experience might be good for you right now?”**

🌐 **Live Demo:** https://zolarium.vercel.app
💻 **Repository:** https://github.com/MarcosJVPR/Zolarium

---

##  The idea

Zolarium is an entertainment discovery platform for Madrid built around a personalized recommendation engine.

Users:

* 🌌 Create a profile using their birth data
* ♈ Generate a complete natal chart
* 🧠 Translate astrological data into Jungian archetype vectors
* 💫 Discover real plans and activities through a Tinder-style swipe interface
* 🗺️ Explore Madrid through an interactive map
* 🐾 Take care of a virtual zodiac companion
* 🤖 Receive an AI-generated introductory reading
* ❤️ Save and interact with plans
* 🎭 Discover activities based on different contexts: dating, solo plans, exploration and more

The project combines a playful visual experience with a recommendation system that continuously learns from user interactions.

---

##  The recommendation engine

The core of Zolarium is not a simple list of filters.

The recommendation system combines four different signals:

```text
┌──────────────────────────────┐
│       PERSONAL PROFILE       │
│  Natal chart + archetypes    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       RECOMMENDATION         │
│           ENGINE             │
├──────────────────────────────┤
│  40% Natal compatibility     │
│  30% Learned preferences     │
│  15% Collective behaviour    │
│  15% Context                 │
└──────────────┬───────────────┘
               │
               ▼
       Personalized plan deck
```

### Personalization includes:

* Natal chart compatibility
* 12 Jungian archetypes
* Age-based modulation
* Practical preferences
* User swipe behaviour
* Collective preferences by zodiac sign
* Distance from Madrid
* Time and date of the event
* Different recommendation modes

The system also includes an exploration mechanism that deliberately introduces plans associated with the user's weaker archetypes, preventing the recommendation loop from becoming too predictable.

In other words:

> **The system learns what you like, but also helps you discover what you might not have tried yet.**

---

##  Tech Stack

### Frontend

* React 19
* Vite
* Tailwind CSS v4
* Framer Motion
* React Leaflet
* Leaflet
* Supercluster

### Backend & Data

* Supabase
* PostgreSQL
* Supabase Auth
* Row Level Security
* PostgreSQL RPC functions
* Serverless API routes

### AI

* Google Gemini API
* Serverless AI reading generation
* Cached user readings

### Data & APIs

* Madrid Open Data
* OpenStreetMap
* Overpass API
* Nominatim geocoding

### Deployment & Automation

* Vercel
* GitHub Actions
* Automated data synchronization pipelines

---

##  Architecture

```text
                    ┌──────────────────┐
                    │      React       │
                    │    Frontend      │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
         Supabase        Gemini API       Map APIs
          Auth + DB          AI          OSM / Madrid
              │
              ▼
       PostgreSQL RPC
              │
              ▼
      Online learning model
              │
              ▼
       Improved recommendations
```

The recommendation engine itself is implemented as modular JavaScript logic, separated from the UI layer.

This means the core personalization system can theoretically be reused in a future React Native application without rewriting the business logic.

---

##  Real-world data pipeline

Zolarium does not rely exclusively on manually created mock data.

The application continuously builds a curated database of real activities and events in Madrid through data pipelines combining:

* Madrid Open Data
* OpenStreetMap
* Overpass API
* Automated GitHub Actions workflows
* Data cleaning and categorization
* Duplicate detection
* Archetype tagging

The project intentionally prioritizes **quality over quantity**.

Instead of showing every possible location in a city, the data pipeline focuses on activities people might genuinely want to discover:

🎳 Bowling
🎮 Gaming & VR
🎤 Karaoke
🧗 Climbing
🎬 Cinema
🎨 Cultural activities
🧩 Escape rooms
🛼 Ice skating
🎲 Board games
🌌 Planetariums
...and more.

---

##  The Zodiac Garden

The virtual pet system is designed as more than a cosmetic feature.

Each user receives a zodiac companion that can be cared for through simple interactions:

* Tap to interact
* Feed the pet
* Track happiness
* Different day/night behaviours
* Sleeping states
* Animated transitions
* Persistent state stored in Supabase

The system follows a **zero-guilt interaction model** inspired by modern cozy games.

The goal is not to punish users for not returning every day.

> The pet should be happy to see you — not make you feel guilty for leaving.

---

##  Main features

### ✦ Personalized Plan Deck

A swipe-based recommendation interface with:

* Framer Motion gestures
* Like/dislike interactions
* Personalized scoring
* Social proof
* Google Maps integration
* Calendar integration
* Saved plans

### ✦ Astral Map of Madrid

An interactive Leaflet map featuring:

* Real Madrid activities
* Category filters
* Marker clustering
* Personalized zodiac compatibility
* Interactive plan cards
* Directions integration

### ✦ AI Astrology Reading

Users can request a personalized introductory reading generated through Gemini.

The system:

* Generates the reading server-side
* Uses the user's natal chart
* Produces a Jungian-inspired interpretation
* Caches the result to avoid unnecessary API calls

The AI is intentionally positioned as a **free introduction to astrology**, while the long-term product vision is to connect users with human astrologers and tarot professionals.

---

## Design & visual direction

Zolarium combines:

🌌 Cosmic UI
🌱 Solarpunk influences
🧚 Fairycore aesthetics
🐾 Kawaii characters
💜 Dark plum backgrounds
✨ Soft gradients
🌟 Animated stars and particles

The visual system was designed to make a recommendation product feel less like a utility and more like a small world the user wants to return to.

The interface includes custom visual assets, layered environments, animated backgrounds and responsive interactions.

---

## What I built

This project allowed me to work across the entire product:

* Product concept
* UX and interaction design
* Frontend architecture
* Database modelling
* Authentication
* Recommendation algorithms
* Online learning logic
* AI API integration
* Data ingestion pipelines
* API integrations
* Maps and geospatial data
* Serverless functions
* Automated scheduled jobs
* Deployment
* Visual design
* Game-like interaction systems

The most technically interesting part of the project was building a recommendation engine that combines:

> **a domain-specific model + behavioural data + collective user data + contextual signals**

rather than relying on a static list of categories.

---

## Roadmap

* [ ] PWA installation support
* [ ] Real user geolocation
* [ ] More pet animations and states
* [ ] Social profiles
* [ ] Improved onboarding experience
* [ ] Marketplace for human astrologers and tarot professionals
* [ ] React Native mobile application
* [ ] More curated, hand-picked experiences
* [ ] Expanded virtual pet interactions

---

##  About the developer

Hi, I'm **Marcos** — a developer with a background in acting, marketing, design and creative technology.

I enjoy building products where technology is not just functional, but also has a strong personality.

My interests sit somewhere between:

```text
Product
   +
Frontend
   +
Creative Technology
   +
Data
   +
Visual Design
```

I'm currently looking for opportunities as a **Junior Full-Stack Developer** where I can continue building meaningful products and grow within a strong technical team.

---

### ✦ Built by:
**MarcosJVPR**

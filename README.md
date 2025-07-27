# 🚀 NutriScan: Your Personal AI-Powered Nutrition Companion

## Redefining Wellness Through Seamless Calorie & Macro Tracking

Welcome to **NutriScan**, a cutting-edge mobile application designed to revolutionize how individuals approach their dietary health. In an increasingly health-conscious world, precise and personalized nutrition guidance is paramount. NutriTrack addresses this need head-on, offering an intuitive, AI-enhanced platform that goes beyond simple logging to provide intelligent recommendations, real-time analytics, and an engaging user experience.

We're building the future of personal nutrition management, making healthy eating accessible, understandable, and deeply integrated into daily life.

---

## 💡 The Core Innovation

NutriScan isn't just another calorie counter; it's an intelligent ecosystem built on three seamlessly integrated pillars:

* **📱 Frontend (Mobile App Interface):** A beautifully crafted React Native application delivering a fluid and engaging user experience. This is where users interact, log meals, visualize progress, and discover new healthy options.
* **🛠 Backend (Robust API Server):** A powerful Node.js server acting as the central nervous system, managing user data, authentication, and serving critical dietary information and social interactions.
* **🤖 Bot Microservice (AI-Powered Nutrition Intelligence):** A dedicated AI microservice leveraging large language models to provide instant, conversational macro-nutrient analysis and personalized dietary insights.

This synergistic architecture ensures a performant, scalable, and intelligent platform that supports users at every step of their wellness journey.

---

## ✨ Key Features & User Experience Highlights

NutriScan delivers a rich set of features designed to empower users and drive consistent engagement:

### 1. Intuitive Meal Logging & Detailed Macro Tracking
* **Effortless Input:** Users can quickly log their meals, inputting details such as `recipe_text`, `calories`, `protein`, `carbs`, and `fat`. The process is streamlined to minimize friction, encouraging consistent tracking.
* **Comprehensive Meal Data:** Beyond basic macros, our system captures rich contextual information including `cuisine`, `meal_time`, `diet_type`, `spice_level`, `prep_time_mins` (for homecooked meals), `serving_size`, `price`, and even `location` (for restaurant meals). This granular data fuels powerful analytics and personalized recommendations.

### 2. Personalized Meal Recommendations
* **Intelligent Discovery:** Our core recommendation engine, powered by the backend, delivers a curated list of meals tailored to individual user preferences, dietary goals, and historical consumption patterns.
* **Dynamic View Modes:** Users can browse recommendations in a visually appealing **Grid View**, offering a broad overview of options, or dive deep into a **Single View** for a full-screen, immersive experience for each meal. The transition between these views is seamless, enhancing discoverability.
* **Rich Recommendation Cards:** Each `RecommendationCard` is meticulously designed to provide an at-a-glance summary:
    * High-quality `meal_image_url` for visual appeal (with robust fallback).
    * Clear `recipe_text` and relevant `cuisine`/`meal_time` tags.
    * Prominent display of `calories`, `protein`, `carbs`, and `fat`.
    * Contextual details: `prep_time_mins` for homecooked meals or `price` and `location` for restaurant options.
    * A unique `score` indicating recommendation relevance, guiding users to optimal choices.

### 3. Social Interaction & Community Engagement
* **Like & Save Functionality:** Users can `like` and `save` meals, fostering a sense of community and allowing them to curate their favorite healthy recipes. These interactions are reflected in real-time (`likesCount`, `savesCount`).
* **Robust Commenting System:** Each meal supports comments, enabling users to share feedback, tips, and engage in discussions about recipes. The `commentsCount` is prominently displayed, encouraging social interaction and content generation.
* **Optimistic UI Updates:** For interactions like liking and saving, the UI updates instantly, providing immediate feedback and a highly responsive feel. Network requests are handled in the background, with intelligent rollback in case of failure.

### 4. Advanced Macro Analytics & Trend Analysis
* **7-Day Performance Dashboard:** The `MacroHistoryChart` provides a compelling visual representation of macro-nutrient intake over the past week. This isn't just a static chart; it's an interactive dashboard.
* **Dynamic Macro Selection:** Users can effortlessly switch between viewing Calories, Protein, Carbs, or Fat trends with a dedicated, visually appealing selector.
* **Key Performance Indicators (KPIs):** Beyond the chart, users gain instant insights into:
    * **Daily Average:** Understanding their typical intake.
    * **Trend Analysis:** A powerful percentage change indicator (`trending-up`/`trending-down` icons with color-coding) showing whether their macro intake is increasing or decreasing over recent days.
    * **Peak & Low Values:** Identifying maximum and minimum intake days.
* **Interactive Data Points:** Tapping on specific points on the chart reveals a detailed tooltip, providing precise macro values for that exact date, enhancing data exploration.
* **Intelligent Empty State:** For new users or those with insufficient data, a motivational "Start Your Journey" card is displayed, clearly explaining the benefits of tracking and encouraging continued engagement.

### 5. Seamless User Authentication & Data Persistence
* **Secure User Accounts:** The backend handles secure user authentication and account management, ensuring data privacy and personalized experiences.
* **Reliable Data Storage:** All meal logs, preferences, and interaction data are persistently stored, allowing users to track their progress over time and access their information anytime, anywhere.

---

## ⚙️ Technical Architecture & Configuration

NutriScan is built with modern, scalable technologies to deliver a high-performance and reliable experience.

### **1. Frontend: React Native (Expo)**

The mobile application is developed using **React Native with Expo**, enabling rapid development, cross-platform compatibility (iOS and Android), and access to native device features.

* **Core Technologies:** React Native, Expo, TypeScript, React Navigation, React Native Paper, `react-native-chart-kit`, `expo-secure-store`, `expo-linear-gradient`, `@expo/vector-icons`.
* **Purpose:** The interactive client-side application.
* **Running the Frontend:**
    1.  Navigate to the `frontend` directory: `cd frontend`
    2.  Install dependencies: `npm install`
    3.  Start the development server: `npm run dev`
        * *Scan the QR code with your Expo Go app (iOS/Android) or run on an emulator/simulator.*

### **2. Backend: Node.js (Express)**

The backend is a robust **Node.js server powered by Express.js**, providing a RESTful API for all application data and business logic.

* **Core Technologies:** Node.js, Express.js, PostgreSQL (database), Authentication libraries.
* **Purpose:** User authentication, API endpoints for meal logging, macro fetching, social interactions (like/save/comment), and data persistence.
* **Running the Backend:**
    1.  Navigate to the `backend` directory: `cd backend`
    2.  Install dependencies: `npm install`
    3.  Start the backend server: `node app.js`

---

## ⚙️ Initial Setup & Configuration (Crucial for First Run)

Before launching NutriScan, it's essential to configure the network settings and API keys:

1.  **Frontend (`frontend/config.ts`)**
    * Update `BASE_URL` with your local machine's IP address. This tells the mobile app where to connect to your backend server.
        ```typescript
        // frontend/config.ts
        export const BASE_URL = "http://YOUR_LOCAL_IP_ADDRESS"; // e.g., "[http://192.168.68.108](http://192.168.68.108)"
        ```
2.  **Backend (`backend/.env`)**
    * Set the `HOST` variable to your IP address to ensure proper Cross-Origin Resource Sharing (CORS) configuration, allowing your frontend to communicate with the backend.
        ```dotenv
        # backend/.env
        HOST=YOUR_LOCAL_IP_ADDRESS # e.g., 192.168.68.108
        PORT=3000 # Or your chosen port
        DATABASE_URL=postgres://user:password@host:port/database # Your PostgreSQL connection string
        JWT_SECRET=YOUR_VERY_SECRET_KEY # A strong, random key for JWT signing
        ```


💡 **How to find your local IP address:**
Open your terminal or command prompt and run:
```bash
ipconfig # On Windows
ifconfig # On macOS/Linux (or `ip a`)

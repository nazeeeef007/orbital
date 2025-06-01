# 🥗 Calorie & Macro Tracker App

This is a mobile application built with React Native that helps users track their daily calorie and macro-nutrient intake. It consists of three main components:

- **Frontend**: The mobile app interface  
- **Backend**: The server handling data and authentication  
- **Bot Microservice**: A chat-based service that provides macro information for meals  

---

## ⚙️ Configuration (Before Running)

Before starting the app, you must configure the IP address and API keys in the following files:

1. **Frontend** (`frontend/config.ts`)  
   - Set your local machine's IP address so the app knows where to send requests:
     ```ts
     // config.ts
     export const API_URL = "http://YOUR_IP_ADDRESS:PORT";
     ```
2. **Backend** (`backend/.env`)  
   - Add your IP address to allow CORS and define the server port:
     ```
     HOST=YOUR_IP_ADDRESS
     PORT=YOUR_PORT
     ```

3. **Bot Microservice** (`bot-microservice/.env`)  
   - Set your OpenAI API key and IP address:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     HOST=YOUR_IP_ADDRESS
     ```

💡 **To find your IP address**, run the following in your terminal:
```bash
ipconfig
```
Look for the `IPV4` value Example:
```
inet 192.168.1.42
```
Use that IP address in the config files.

---

## 📱 FRONTEND

### Purpose

The frontend is a React Native application that allows users to:

- Log their meals and calories  
- Track daily intake of carbohydrates, proteins, and fats  
- View nutritional history and summaries  
- Interact with a chat bot for nutrition info  

### How to Run

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🛠 BACKEND

### Purpose

The backend is a Node.js server that provides:

- User authentication and account management  
- APIs to log and fetch food and macro data  
- Database connectivity and data persistence  

### How to Run

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   node app.js
   ```

---

## 🤖 BOT MICROSERVICE

### Purpose

The bot microservice is a Node.js-based chatbot that:

- Accepts natural language input about meals  
- Parses meal descriptions and returns estimated macro-nutrient values  
- Integrates with the frontend chat interface  

### How to Run

1. Navigate to the bot microservice directory:
   ```bash
   cd bot-microservice
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the bot service:
   ```bash
   node index.js
   ```

---

## 📂 Project Structure

```
.
├── frontend/           # React Native mobile app  
├── backend/            # Node.js backend server  
└── bot-microservice/   # Chat bot microservice  
```

---  


## 📧 Contact

If you'd like to contribute, suggest features, or report bugs, DONT :).

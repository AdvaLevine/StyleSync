# 👗 StyleSync – Smart AI-Powered Wardrobe Assistant

> **StyleSync** is an intelligent cloud-based wardrobe manager that offers AI-generated outfit recommendations tailored to what you own considering the weather, your calendar, and personal style.

---

## 🚀 Overview

**StyleSync** simplifies your daily outfit decisions by combining fashion, AI, and cloud services into a seamless experience. Whether you're prepping for a rainy day, a job interview, or just another Tuesday, StyleSync ensures your wardrobe is organized, sustainable, and always on point.

### 🧠 Key Features

- 📸 Visual wardrobe manager (with support for real item photos)
- 🧠 ChatGPT integration for personalized outfit ideas
- 📅 Google Calendar sync for event-specific outfit suggestions
- ☀️ Weather-based clothing recommendations
- 🔐 Secure user authentication with AWS Cognito
- 📂 Serverless image uploads using presigned URLs

---

## 🧱 Architecture

| Layer         | Tech Stack                                                                 |
|--------------|-----------------------------------------------------------------------------|
| **Frontend** | React.js, Bootstrap 5, React Lucide, Base44                                 |
| **Backend**  | Python (AWS Lambda), API Gateway, Serverless architecture                   |
| **Database** | Amazon RDS (PostgreSQL), Amazon S3 (for image storage)                      |
| **AI Engine**| OpenAI (ChatGPT 4o), OpenWeather API, Google Calendar API                   |
| **Auth**     | AWS Cognito                                                                 |
| **DevOps**   | GitHub, Amplify                                                             |

📖 [See full architecture, database schema and more »](https://docs.google.com/document/d/1ZKNXdOoVsXKeEqCixGz9XjZz7PlInmsP1lvIcFWbmcI/edit?usp=sharing)

---

## 📂 Project Structure

```text
StyleSync/
├── frontend/
│   └── src/
│       ├── assets/
│       │   ├── images/                  # Static images
│       │   └── styles/                  # CSS modules
│       │       ├── AddItem.css
│       │       ├── CreateWardrobe.css
│       │       ├── Home.css
│       │       ├── OutfitRecom.css
│       │       ├── Profile.css
│       │       ├── Settings.css
│       │       └── ViewWardrobe.css
│       ├── auth/
│       │   └── getUserInfo.jsx          # User info utility
│       ├── aws/
│       │   └── UserPool.jsx             # Cognito configuration
│       ├── components/                  # Reusable UI components
│       │   ├── Dropdown.css
│       │   ├── Dropdown.jsx
│       │   ├── Layout.jsx
│       │   └── MultiSelectDropdown.jsx
│       ├── hooks/
│       ├── pages/                       # App pages
│       │   ├── AddItem.jsx
│       │   ├── CreateWardrobe.jsx
│       │   ├── Home.jsx
│       │   ├── LoginPage.jsx
│       │   ├── NotFound.jsx
│       │   ├── OutfitRecom.jsx
│       │   ├── Profile.jsx
│       │   ├── Settings.jsx
│       │   └── ViewWardrobe.jsx
│       ├── services/
│       │   ├── itemsCache.js
│       │   └── wardrobeCache.js
│       ├── App.jsx                      # Main React app
│       └── index.js                     # Entry point
```
```
---
## 📸 Preview

🖼️ View the full presentation here:  
👉 [📽️ Canva Presentation](https://www.canva.com/design/DAGoXQ5NmL8/3Joqi5oPXk0UjTp440KRMw/edit?utm_content=DAGoXQ5NmL8&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

---

## ⚙️ Getting Started

### 🔐 Prerequisites

- React
- Python 3.9 (AWS Lambdas)
- AWS account with Cognito, S3, API Gateway, Amplify and RDS set up
- OpenAI API
- Google Calendar API key
- OpenWeatherMap API key

---

## 🌐 Live App

You can access the live **StyleSync** application here:

[🔗 https://main.d1qreohr4migr5.amplifyapp.com](https://main.d1qreohr4migr5.amplifyapp.com)

> **Login via AWS Cognito**  
Use the secure authentication portal to sign in:

[🔐 Login with Cognito](https://us-east-1lvylnwjnh.auth.us-east-1.amazoncognito.com/login?client_id=6jt8p3s82dcj78eomqpra1qo0i&response_type=code&scope=email+openid+profile&redirect_uri=https://main.d1qr_)

---
## 🤝 Contributors
-Tal Dor
-Adva Levine

---
## 📄 Documentation

- 📘 [Design & Product Document (Google Doc)](https://docs.google.com/document/d/1ZKNXdOoVsXKeEqCixGz9XjZz7PlInmsP1lvIcFWbmcI/edit?usp=sharing)
- 🎞️ [Presentation (Canva)](https://www.canva.com/design/DAGoXQ5NmL8/3Joqi5oPXk0UjTp440KRMw/edit?utm_content=DAGoXQ5NmL8&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

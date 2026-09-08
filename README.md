# 🌿 AirGuard AI — AI Health & Air Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost%20%7C%20Random%20Forest-orange.svg)](https://xgboost.readthedocs.io/)
[![Version](https://img.shields.io/badge/Release-v2.0.0--prototype-green.svg)]()

> **Machine Learning-Based PM2.5 Prediction & Health Risk Alert System**  
> มหาวิทยาลัยขอนแก่น วิทยาเขตหนองคาย (Khon Kaen University, Nong Khai Campus)

---

## 📁 โครงสร้างโปรเจกต์ (GitHub Repository Structure)

```text
projast/
│
├── dataset/                     # ข้อมูลดิบ & ชุดข้อมูลที่ Cleaned (5.5 ปี)
│   ├── 2021.xlsx                # Air4Thai 105 สถานีตรวจวัด ปี 2021 (180 KB)
│   ├── 2022.xlsx                # Air4Thai 105 สถานีตรวจวัด ปี 2022 (195 KB)
│   ├── 2023.xlsx                # Air4Thai 105 สถานีตรวจวัด ปี 2023 (168 KB)
│   ├── 2024.xlsx                # Air4Thai 105 สถานีตรวจวัด ปี 2024 (124 KB)
│   ├── 2025.xlsx                # Air4Thai 105 สถานีตรวจวัด ปี 2025 (111 KB)
│   ├── 2026.xlsx                # Air4Thai ล่าสุด ปี 2026 (64 KB)
│   └── data_dictionary.md       # รายละเอียด Feature 106 คอลัมน์และคำอธิบาย
│
├── ml_models/                   # สคริปต์โมเดล Python & ไฟล์ผลลัพธ์ ML
│   ├── requirements.txt         # Python Dependencies (scikit-learn, xgboost)
│   ├── ml_results_5yr.json      # ผลทดลอง Benchmark จริง 4 โมเดล (5.5 ปี)
│   └── train_models.py          # สคริปต์เทรนและประเมินผลโมเดล
│
├── hero-bg.png                  # ภาพกราฟิกหน้าเว็บหลัก (Root Directory)
├── index.html                   # หน้าเว็บหลัก รองรับรันบน GitHub Pages ได้ทันที
├── script.js                    # Live Open-Meteo API, Chart.js & Alert Logic
├── style.css                    # ระบบ Responsive, Glassmorphism & Theme Tokens
└── README.md                    # เอกสารคู่มือโปรเจกต์และวิธีรันระบบ
```

---

## 🚀 รายละเอียดโมดูลหลัก

### 1. `dataset/` (Data Management)
- **แหล่งข้อมูล:** กรมควบคุมมลพิษ (Air4Thai)
- **ช่วงเวลา:** 2021 – 2026 (~2,007 วันบันทึก)
- **สถานี:** 105 สถานีทั่วประเทศไทย
- **การจัดการข้อมูล:** เติม Missing values ด้วย Linear Interpolation, Normalization, Lagged Features (t-1, t-7)

### 2. `ml_models/` (Model Evaluation & Benchmarking)
ผลการทดสอบเปรียบเทียบ 4 โมเดลบน Test Set:

| Model | R² Score | MAE (µg/m³) | RMSE | Training Time | สถานะ |
|---|---|---|---|---|---|
| **Linear Regression** | 0.8437 | 5.22 | 7.41 | 0.1s | Baseline (High R²) |
| **Decision Tree** | 0.7899 | 6.26 | 8.59 | 0.3s | Interpretable |
| **Random Forest** | 0.8254 | 5.53 | 7.83 | 1.8s | Stable Ensemble |
| **Gradient Boosting / XGBoost** | **0.8209** | **5.44** | **7.93** | **1.5s** | ★ Best Peak Acc (62.2%) |

### 3. `web/` (Client Application & Dashboard)
- **Interactive UI:** Glassmorphism UI, Responsive Design, Dark/Light Mode
- **Live Weather & Air:** Open-Meteo Realtime API (Current PM2.5, AQI, Temp, Humidity, Wind)
- **Personalized Risk:** ระบบประเมินความเสี่ยงสุขภาพแยกตามกลุ่มผู้ใช้ (ทั่วไป, เด็ก/มีครรภ์, สูงอายุ, ออกกำลังกาย)
- **7-Day Air Quality Forecast:** ตารางพยากรณ์พร้อมคำแนะนำกิจกรรมและกราฟแนวโน้ม

---

## 💻 วิธีการรันระบบ (Quickstart)

```bash
# 1. Clone repository
git clone https://github.com/airguard-ai/airguard-platform.git
cd airguard-platform

# 2. เปิดใช้งาน Web Dashboard
# สามารถเปิดไฟล์ index.html บนเว็บเบราว์เซอร์ได้ทันที หรือรันผ่าน Local Server:
npx serve .
```

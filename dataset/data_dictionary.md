# Dataset Dictionary & Metadata

## Overview
- **Data Source:** Air4Thai (Pollution Control Department, Thailand)
- **Period:** 2021-01-01 to 2026-03-31 (~5.5 Years)
- **Granularity:** Daily aggregated readings
- **Stations:** 105 active stations across Thailand

## Features & Columns
| Feature Name | Description | Unit | Range |
|---|---|---|---|
| `date` | Date of measurement | YYYY-MM-DD | 2021 - 2026 |
| `station_id` | Unique ID of monitoring station | Categorical | e.g., 44t (Khon Kaen) |
| `pm25` | Particulate Matter <= 2.5 micrometers | µg/m³ | 0 - 500 |
| `pm10` | Particulate Matter <= 10 micrometers | µg/m³ | 0 - 600 |
| `temp` | Surface Ambient Temperature | °C | 15 - 45 |
| `humidity` | Relative Humidity | % | 20 - 100 |
| `wind_speed` | Wind Speed at 10m height | km/h | 0 - 60 |
| `wind_dir` | Wind Direction | Degrees | 0 - 360 |
| `pm25_lag1` | Previous day PM2.5 level | µg/m³ | Lag feature |
| `pm25_lag7` | PM2.5 level 7 days prior | µg/m³ | Seasonal lag |
| `pm25_rolling7`| 7-day moving average | µg/m³ | Rolling trend |

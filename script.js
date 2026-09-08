// ===== AirGuard AI — Main Application Script =====
// Upgraded: SaaS-Ready Platform with Open-Meteo API Integration

// =============================================
// 1. Loading Screen
// =============================================
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.add('hidden');
    initCounters();
    initParticles();
    fetchLiveData();
  }, 1800);
});

// =============================================
// 2. Theme Toggle (Dark/Light)
// =============================================
const themeToggle = document.getElementById('themeToggle');
const htmlEl = document.documentElement;

const savedTheme = localStorage.getItem('airguard-theme') || 'dark';
htmlEl.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = htmlEl.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  htmlEl.setAttribute('data-theme', next);
  localStorage.setItem('airguard-theme', next);
  updateThemeIcon(next);
  // Re-render active charts
  if (benchmarkChartsInit) { destroyBenchmarkCharts(); initBenchmarkCharts(); }
  if (forecastChartInit) { destroyForecastChart(); renderForecastChart(cachedForecastHourly); }
});

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector('i');
  icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// =============================================
// 3. Navigation
// =============================================
const sections = document.querySelectorAll('.page-section');
const navLinks = document.querySelectorAll('.nav-links a');
let benchmarkChartsInit = false;
let forecastChartInit = false;

function navigateTo(page) {
  sections.forEach(s => s.classList.remove('active'));
  const target = document.getElementById(page);
  if (target) {
    target.classList.add('active');
    target.style.animation = 'none';
    target.offsetHeight;
    target.style.animation = 'fadeIn 0.5s ease';
  }
  navLinks.forEach(a => a.classList.remove('active'));
  navLinks.forEach(a => {
    if (a.getAttribute('href') === '#' + page) a.classList.add('active');
  });
  document.getElementById('navLinks').classList.remove('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Lazy init
  if (page === 'benchmark' && !benchmarkChartsInit) {
    setTimeout(() => { initBenchmarkCharts(); benchmarkChartsInit = true; }, 300);
  }
  if (page === 'forecast') {
    fetchForecastData();
  }
  if (page === 'alert') {
    updatePersonalizedAlert();
  }
  setTimeout(initScrollAnimations, 100);
  setTimeout(initCounters, 200);
}

// Mobile menu toggle
document.getElementById('mobileToggle').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('show');
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  navbar.classList.toggle('scrolled', window.scrollY > 20);
  const btt = document.getElementById('backToTop');
  btt.classList.toggle('visible', window.scrollY > 400);
});

// =============================================
// 4. Counter Animations
// =============================================
function initCounters() {
  const counters = document.querySelectorAll('.counter-value');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'));
        if (isNaN(target)) return;
        animateCounter(el, 0, target, 1500);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });
  counters.forEach(c => observer.observe(c));
}

function animateCounter(el, start, end, duration) {
  const startTime = performance.now();
  const range = end - start;
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + range * easeProgress);
    el.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// =============================================
// 5. Scroll Animations
// =============================================
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  elements.forEach(el => observer.observe(el));
}
initScrollAnimations();

// =============================================
// 6. Hero Particles
// =============================================
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 35; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.width = (2 + Math.random() * 4) + 'px';
    p.style.height = p.style.width;
    p.style.animationDuration = (8 + Math.random() * 12) + 's';
    p.style.animationDelay = Math.random() * 10 + 's';
    p.style.opacity = 0.2 + Math.random() * 0.4;
    container.appendChild(p);
  }
}

// =============================================
// 7. Open-Meteo API — Live Data
// =============================================
const API_LAT = 16.4419;
const API_LON = 102.8360;
let cachedLiveData = null;
let cachedForecastData = null;
let cachedForecastHourly = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchLiveData() {
  const now = Date.now();
  if (cachedLiveData && (now - lastFetchTime) < CACHE_DURATION) {
    renderLiveData(cachedLiveData);
    return;
  }
  try {
    const [aqRes, wxRes] = await Promise.all([
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${API_LAT}&longitude=${API_LON}&current=pm2_5,pm10,us_aqi`),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${API_LAT}&longitude=${API_LON}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=Asia/Bangkok`)
    ]);
    const aqData = await aqRes.json();
    const wxData = await wxRes.json();
    cachedLiveData = {
      pm25: aqData.current?.pm2_5 ?? null,
      pm10: aqData.current?.pm10 ?? null,
      aqi: aqData.current?.us_aqi ?? null,
      temp: wxData.current?.temperature_2m ?? null,
      humidity: wxData.current?.relative_humidity_2m ?? null,
      wind: wxData.current?.wind_speed_10m ?? null,
    };
    lastFetchTime = now;
    renderLiveData(cachedLiveData);
  } catch (err) {
    console.warn('API fetch failed, using fallback data:', err);
    cachedLiveData = { pm25: 22, pm10: 38, aqi: 68, temp: 29, humidity: 72, wind: 8.5 };
    renderLiveData(cachedLiveData);
  }
}

function renderLiveData(data) {
  // Hero Quick Status
  setText('livepm25', data.pm25 != null ? data.pm25.toFixed(1) : '--');
  setText('livetemp', data.temp != null ? data.temp.toFixed(1) : '--');
  setText('livehumidity', data.humidity != null ? Math.round(data.humidity) : '--');
  setText('livewind', data.wind != null ? data.wind.toFixed(1) : '--');

  // Quick Status Action Message
  const actionEl = document.getElementById('quickStatusAction');
  if (actionEl && data.pm25 != null) {
    const { message, icon, className } = getActionMessage(data.pm25);
    actionEl.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    actionEl.className = 'quick-status-action ' + className;
  }

  // Update alert page too if data available
  updatePersonalizedAlert();
}

function getActionMessage(pm25) {
  if (pm25 <= 15) return { message: '✅ ปลอดภัย — เหมาะสำหรับทุกกิจกรรมกลางแจ้ง', icon: 'fa-check-circle', className: 'status-good' };
  if (pm25 <= 25) return { message: '🟡 ปานกลาง — กลุ่มเสี่ยงควรระวัง', icon: 'fa-info-circle', className: 'status-moderate' };
  if (pm25 <= 37.5) return { message: '🟠 ไม่ดีสำหรับกลุ่มเสี่ยง — ลดกิจกรรมกลางแจ้ง', icon: 'fa-exclamation-triangle', className: 'status-sensitive' };
  if (pm25 <= 75) return { message: '🔴 ไม่ดีต่อสุขภาพ — สวมหน้ากาก N95 เมื่อออกนอกอาคาร', icon: 'fa-head-side-mask', className: 'status-unhealthy' };
  return { message: '🟣 อันตราย — อยู่ในอาคารเท่านั้น ปิดหน้าต่าง เปิดเครื่องฟอกอากาศ', icon: 'fa-skull-crossbones', className: 'status-hazardous' };
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// =============================================
// 8. Personalized Risk Alert
// =============================================
let currentRiskGroup = 'general';

function selectRiskGroup(group) {
  currentRiskGroup = group;
  // Update button states
  document.querySelectorAll('.risk-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-group') === group);
  });
  updatePersonalizedAlert();
}

function updatePersonalizedAlert() {
  if (!cachedLiveData) return;
  const pm25 = cachedLiveData.pm25;
  if (pm25 == null) return;

  // Update current AQ display
  setText('alertPM25Value', pm25.toFixed(1));
  const aqiInfo = classifyAQI(pm25);
  setText('alertAQIValue', aqiInfo.aqi);
  const aqiValueEl = document.getElementById('alertAQIValue');
  if (aqiValueEl) aqiValueEl.style.color = aqiInfo.riskColor;

  const pm25ValueEl = document.getElementById('alertPM25Value');
  if (pm25ValueEl) pm25ValueEl.style.color = aqiInfo.riskColor;

  // Update time
  const timeEl = document.getElementById('alertUpdateTime');
  if (timeEl) {
    timeEl.textContent = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

  // Update gauge
  const marker = document.getElementById('alertGaugeMarker');
  if (marker) marker.style.left = aqiInfo.gaugePos;

  // Get personalized advice
  const advice = getPersonalizedAdvice(pm25, currentRiskGroup);

  // Update advisory
  const advisoryIcon = document.getElementById('advisoryIcon');
  const advisoryStatus = document.getElementById('advisoryStatus');
  const advisorySubtitle = document.getElementById('advisorySubtitle');
  const advisoryRecs = document.getElementById('advisoryRecommendations');
  const advisoryBox = document.getElementById('healthAdvisory');

  if (advisoryIcon) advisoryIcon.innerHTML = `<i class="fas ${advice.icon}"></i>`;
  if (advisoryIcon) advisoryIcon.style.background = advice.bgGradient;
  if (advisoryStatus) { advisoryStatus.textContent = advice.status; advisoryStatus.style.color = advice.color; }
  if (advisorySubtitle) advisorySubtitle.textContent = advice.subtitle;
  if (advisoryBox) advisoryBox.style.borderLeftColor = advice.color;

  if (advisoryRecs) {
    advisoryRecs.innerHTML = advice.recommendations.map(r => `
      <div class="advisory-rec-item">
        <i class="fas ${r.icon}" style="color:${advice.color}"></i>
        <span>${r.text}</span>
      </div>
    `).join('');
  }
}

function getPersonalizedAdvice(pm25, group) {
  const level = getAQLevel(pm25);

  const adviceMap = {
    general: {
      good: {
        status: 'ปลอดภัย — เหมาะสำหรับทุกกิจกรรม',
        subtitle: 'คุณภาพอากาศดีเยี่ยม ออกไปใช้ชีวิตได้เต็มที่',
        icon: 'fa-face-smile-beam', color: '#66bb6a', bgGradient: 'linear-gradient(135deg, #66bb6a, #43a047)',
        recommendations: [
          { icon: 'fa-check-circle', text: 'อากาศดี สามารถทำกิจกรรมกลางแจ้งได้ตามปกติ' },
          { icon: 'fa-window-maximize', text: 'เปิดหน้าต่างระบายอากาศได้' },
          { icon: 'fa-person-running', text: 'เหมาะสำหรับออกกำลังกายกลางแจ้ง' },
        ]
      },
      moderate: {
        status: 'ปานกลาง — ระวังหากไวต่ออากาศ',
        subtitle: 'คนทั่วไปใช้ชีวิตได้ปกติ แต่กลุ่มเสี่ยงควรระวัง',
        icon: 'fa-triangle-exclamation', color: '#ffeb3b', bgGradient: 'linear-gradient(135deg, #ffeb3b, #f9a825)',
        recommendations: [
          { icon: 'fa-info-circle', text: 'คนทั่วไปสามารถทำกิจกรรมได้ตามปกติ' },
          { icon: 'fa-lungs', text: 'ผู้มีโรคทางเดินหายใจควรพกยาติดตัว' },
          { icon: 'fa-eye', text: 'ติดตามสถานการณ์อากาศอย่างต่อเนื่อง' },
        ]
      },
      sensitive: {
        status: 'ไม่ดีสำหรับกลุ่มเสี่ยง',
        subtitle: 'ลดกิจกรรมกลางแจ้ง สวมหน้ากากเมื่อจำเป็น',
        icon: 'fa-head-side-mask', color: '#ff9800', bgGradient: 'linear-gradient(135deg, #ff9800, #e65100)',
        recommendations: [
          { icon: 'fa-mask', text: 'สวมหน้ากาก N95 เมื่อออกนอกอาคาร' },
          { icon: 'fa-house', text: 'ปิดหน้าต่างและใช้เครื่องฟอกอากาศ' },
          { icon: 'fa-person-walking', text: 'ลดกิจกรรมกลางแจ้งที่ใช้แรงมาก' },
        ]
      },
      unhealthy: {
        status: 'อันตราย — หลีกเลี่ยงกลางแจ้ง',
        subtitle: 'ทุกคนควรระวัง สวมหน้ากาก N95 ตลอดเวลา',
        icon: 'fa-skull-crossbones', color: '#ef5350', bgGradient: 'linear-gradient(135deg, #ef5350, #b71c1c)',
        recommendations: [
          { icon: 'fa-ban', text: 'หลีกเลี่ยงกิจกรรมกลางแจ้งทั้งหมด' },
          { icon: 'fa-head-side-mask', text: 'สวมหน้ากาก N95 ตลอดเวลาเมื่ออยู่นอกอาคาร' },
          { icon: 'fa-fan', text: 'เปิดเครื่องฟอกอากาศ HEPA ที่กำลังสูงสุด' },
          { icon: 'fa-phone', text: 'พบแพทย์ทันทีหากมีอาการหอบหืดหรือแน่นหน้าอก' },
        ]
      },
    },
    children: {
      good: {
        status: 'ปลอดภัยสำหรับเด็กและหญิงตั้งครรภ์',
        subtitle: 'อากาศดี เด็กๆ เล่นกลางแจ้งได้อย่างสบายใจ',
        icon: 'fa-baby', color: '#66bb6a', bgGradient: 'linear-gradient(135deg, #66bb6a, #43a047)',
        recommendations: [
          { icon: 'fa-check-circle', text: 'เด็กสามารถเล่นกลางแจ้งได้ตามปกติ' },
          { icon: 'fa-person-pregnant', text: 'หญิงตั้งครรภ์ออกกำลังกายเบาๆ ได้' },
          { icon: 'fa-droplet', text: 'ดื่มน้ำให้เพียงพอ' },
        ]
      },
      moderate: {
        status: 'ระวัง — เด็กและหญิงตั้งครรภ์ควรจำกัดเวลา',
        subtitle: 'จำกัดกิจกรรมกลางแจ้งไม่เกิน 1 ชั่วโมง',
        icon: 'fa-baby', color: '#ffeb3b', bgGradient: 'linear-gradient(135deg, #ffeb3b, #f9a825)',
        recommendations: [
          { icon: 'fa-clock', text: 'จำกัดเวลาเล่นกลางแจ้งไม่เกิน 1 ชั่วโมง' },
          { icon: 'fa-person-pregnant', text: 'หญิงตั้งครรภ์หลีกเลี่ยงพื้นที่จราจรหนาแน่น' },
          { icon: 'fa-lungs', text: 'สังเกตอาการไอ จาม หายใจลำบากในเด็ก' },
        ]
      },
      sensitive: {
        status: '⚠️ ไม่ปลอดภัย — เด็กควรอยู่ในอาคาร',
        subtitle: 'เด็กเล็กและหญิงตั้งครรภ์ไม่ควรออกนอกอาคาร',
        icon: 'fa-baby', color: '#ff9800', bgGradient: 'linear-gradient(135deg, #ff9800, #e65100)',
        recommendations: [
          { icon: 'fa-house', text: 'เด็กเล็กควรอยู่ในอาคารที่มีเครื่องฟอกอากาศ' },
          { icon: 'fa-person-pregnant', text: 'หญิงตั้งครรภ์ห้ามออกนอกอาคาร' },
          { icon: 'fa-mask', text: 'สวมหน้ากาก N95 ให้เด็กหากจำเป็นต้องออก' },
          { icon: 'fa-school', text: 'โรงเรียนควรงดกิจกรรมกลางแจ้ง' },
        ]
      },
      unhealthy: {
        status: '🚨 อันตรายมาก — ห้ามเด็กออกนอกอาคาร',
        subtitle: 'งดกิจกรรมกลางแจ้งทั้งหมด ปิดหน้าต่าง เปิดเครื่องฟอก',
        icon: 'fa-baby', color: '#ef5350', bgGradient: 'linear-gradient(135deg, #ef5350, #b71c1c)',
        recommendations: [
          { icon: 'fa-ban', text: 'ห้ามเด็กออกนอกอาคารโดยเด็ดขาด' },
          { icon: 'fa-person-pregnant', text: 'หญิงตั้งครรภ์อยู่ในอาคารเท่านั้น' },
          { icon: 'fa-fan', text: 'เปิดเครื่องฟอกอากาศตลอดเวลา' },
          { icon: 'fa-hospital', text: 'พบแพทย์ทันทีหากมีอาการผิดปกติ' },
        ]
      },
    },
    elderly: {
      good: {
        status: 'ปลอดภัยสำหรับผู้สูงอายุและผู้ป่วยภูมิแพ้',
        subtitle: 'ออกไปเดินเล่นหรือออกกำลังกายเบาๆ ได้',
        icon: 'fa-person-cane', color: '#66bb6a', bgGradient: 'linear-gradient(135deg, #66bb6a, #43a047)',
        recommendations: [
          { icon: 'fa-check-circle', text: 'ผู้สูงอายุทำกิจกรรมกลางแจ้งได้ตามปกติ' },
          { icon: 'fa-pills', text: 'พกยาประจำตัวไปด้วยเสมอ' },
          { icon: 'fa-droplet', text: 'ดื่มน้ำให้เพียงพอ ระวังขาดน้ำ' },
        ]
      },
      moderate: {
        status: 'ระวัง — ผู้สูงอายุจำกัดกิจกรรมกลางแจ้ง',
        subtitle: 'พกยา, หลีกเลี่ยงแดดจัด, ดื่มน้ำบ่อยๆ',
        icon: 'fa-person-cane', color: '#ffeb3b', bgGradient: 'linear-gradient(135deg, #ffeb3b, #f9a825)',
        recommendations: [
          { icon: 'fa-clock', text: 'จำกัดกิจกรรมกลางแจ้งไม่เกิน 30 นาที' },
          { icon: 'fa-pills', text: 'ผู้ป่วยหอบหืดพกยาพ่นขยายหลอดลม' },
          { icon: 'fa-stethoscope', text: 'สังเกตอาการหายใจลำบาก เวียนศีรษะ' },
        ]
      },
      sensitive: {
        status: '⚠️ ไม่ปลอดภัย — ผู้สูงอายุควรอยู่ในอาคาร',
        subtitle: 'ผู้ป่วยโรคหัวใจ/ปอดเรื้อรังอยู่ในอาคารเท่านั้น',
        icon: 'fa-person-cane', color: '#ff9800', bgGradient: 'linear-gradient(135deg, #ff9800, #e65100)',
        recommendations: [
          { icon: 'fa-house', text: 'ผู้สูงอายุควรอยู่ในอาคาร' },
          { icon: 'fa-heart-pulse', text: 'ผู้ป่วยโรคหัวใจต้องวัดความดันทุก 4 ชม.' },
          { icon: 'fa-mask', text: 'สวมหน้ากาก N95 หากต้องออกนอกอาคาร' },
          { icon: 'fa-fan', text: 'เปิดเครื่องฟอกอากาศในห้องนอน' },
        ]
      },
      unhealthy: {
        status: '🚨 อันตรายมาก — ห้ามผู้สูงอายุออกนอกอาคาร',
        subtitle: 'ปิดหน้าต่าง เปิดเครื่องฟอก วัดออกซิเจน',
        icon: 'fa-person-cane', color: '#ef5350', bgGradient: 'linear-gradient(135deg, #ef5350, #b71c1c)',
        recommendations: [
          { icon: 'fa-ban', text: 'ห้ามออกนอกอาคาร งดกิจกรรมทุกชนิด' },
          { icon: 'fa-lungs', text: 'วัดระดับออกซิเจนในเลือดทุก 2 ชม.' },
          { icon: 'fa-hospital', text: 'พบแพทย์ทันทีหากออกซิเจน < 95%' },
          { icon: 'fa-phone', text: 'เตรียมเบอร์ฉุกเฉิน 1669 ไว้' },
        ]
      },
    },
    exercise: {
      good: {
        status: '🏃 เหมาะสำหรับออกกำลังกายกลางแจ้ง!',
        subtitle: 'อากาศดีเยี่ยม วิ่ง ปั่นจักรยาน ว่ายน้ำได้เต็มที่',
        icon: 'fa-person-running', color: '#66bb6a', bgGradient: 'linear-gradient(135deg, #66bb6a, #43a047)',
        recommendations: [
          { icon: 'fa-check-circle', text: 'วิ่ง ปั่นจักรยาน เล่นกีฬากลางแจ้งได้เต็มที่' },
          { icon: 'fa-stopwatch', text: 'ไม่จำกัดเวลาออกกำลังกาย' },
          { icon: 'fa-bottle-water', text: 'ดื่มน้ำให้เพียงพอขณะออกกำลังกาย' },
        ]
      },
      moderate: {
        status: '🚶 ออกกำลังกายได้ แต่ลดความเข้มข้น',
        subtitle: 'วิ่งช้าหรือเดินเร็วแทนวิ่งเร็ว หลีกเลี่ยงริมถนน',
        icon: 'fa-person-running', color: '#ffeb3b', bgGradient: 'linear-gradient(135deg, #ffeb3b, #f9a825)',
        recommendations: [
          { icon: 'fa-person-walking', text: 'ลดความเข้มข้นเป็นวิ่งช้าหรือเดินเร็ว' },
          { icon: 'fa-clock', text: 'จำกัดเวลาออกกำลังกายไม่เกิน 1 ชม.' },
          { icon: 'fa-route', text: 'หลีกเลี่ยงเส้นทางริมถนนใหญ่' },
        ]
      },
      sensitive: {
        status: '⚠️ งดออกกำลังกายกลางแจ้ง',
        subtitle: 'ย้ายออกกำลังกายไปในอาคารหรือฟิตเนส',
        icon: 'fa-person-running', color: '#ff9800', bgGradient: 'linear-gradient(135deg, #ff9800, #e65100)',
        recommendations: [
          { icon: 'fa-dumbbell', text: 'ย้ายออกกำลังกายไปในอาคาร/ฟิตเนส' },
          { icon: 'fa-ban', text: 'งดวิ่ง/ปั่นจักรยานกลางแจ้ง' },
          { icon: 'fa-lungs', text: 'การหายใจแรงขณะออกกำลังทำให้สูดฝุ่น PM2.5 เข้าปอดมากขึ้น' },
          { icon: 'fa-mask', text: 'สวมหน้ากาก N95 หากจำเป็นต้องอยู่กลางแจ้ง' },
        ]
      },
      unhealthy: {
        status: '🚨 ห้ามออกกำลังกายกลางแจ้ง!',
        subtitle: 'อันตรายต่อระบบหายใจอย่างร้ายแรง',
        icon: 'fa-person-running', color: '#ef5350', bgGradient: 'linear-gradient(135deg, #ef5350, #b71c1c)',
        recommendations: [
          { icon: 'fa-ban', text: 'ห้ามออกกำลังกายกลางแจ้งโดยเด็ดขาด' },
          { icon: 'fa-heart-pulse', text: 'การวิ่งในอากาศเป็นพิษทำลายปอดเทียบเท่าสูบบุหรี่ 1 ซอง' },
          { icon: 'fa-house', text: 'ออกกำลังกายในอาคารปิดที่มีเครื่องฟอกอากาศเท่านั้น' },
          { icon: 'fa-hospital', text: 'หากมีอาการแน่นหน้าอก ไอเรื้อรัง พบแพทย์ทันที' },
        ]
      },
    },
  };

  return adviceMap[group]?.[level] || adviceMap.general[level];
}

function getAQLevel(pm25) {
  if (pm25 <= 15) return 'good';
  if (pm25 <= 25) return 'moderate';
  if (pm25 <= 37.5) return 'sensitive';
  return 'unhealthy';
}

function classifyAQI(pm25) {
  if (pm25 <= 15) return { aqi: Math.round(pm25 / 15 * 50), aqiLabel: 'Good', riskColor: '#66bb6a', gaugePos: (pm25 / 15 * 20) + '%' };
  if (pm25 <= 25) return { aqi: 50 + Math.round((pm25 - 15) / 10 * 25), aqiLabel: 'Moderate', riskColor: '#ffeb3b', gaugePos: (20 + (pm25 - 15) / 10 * 15) + '%' };
  if (pm25 <= 37.5) return { aqi: 76 + Math.round((pm25 - 25) / 12.5 * 74), aqiLabel: 'Unhealthy SG', riskColor: '#ff9800', gaugePos: (35 + (pm25 - 25) / 12.5 * 20) + '%' };
  if (pm25 <= 75) return { aqi: 151 + Math.round((pm25 - 37.5) / 37.5 * 49), aqiLabel: 'Unhealthy', riskColor: '#ef5350', gaugePos: (55 + (pm25 - 37.5) / 37.5 * 20) + '%' };
  return { aqi: 200 + Math.round((pm25 - 75) / 25 * 100), aqiLabel: 'Hazardous', riskColor: '#9c27b0', gaugePos: '90%' };
}

// =============================================
// 9. 7-Day Forecast
// =============================================
let forecastChart = null;

async function fetchForecastData() {
  const grid = document.getElementById('forecastCardsGrid');
  if (cachedForecastData && cachedForecastHourly) {
    renderForecastCards(cachedForecastData);
    renderForecastChart(cachedForecastHourly);
    return;
  }

  try {
    const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${API_LAT}&longitude=${API_LON}&hourly=pm2_5,pm10,us_aqi&forecast_days=7&timezone=Asia/Bangkok`);
    const data = await res.json();
    const hourlyTimes = data.hourly.time;
    const hourlyPM25 = data.hourly.pm2_5;

    cachedForecastHourly = { times: hourlyTimes, pm25: hourlyPM25 };

    // Calculate daily averages
    const dailyData = [];
    for (let d = 0; d < 7; d++) {
      const dayStart = d * 24;
      const dayEnd = Math.min(dayStart + 24, hourlyPM25.length);
      const dayValues = hourlyPM25.slice(dayStart, dayEnd).filter(v => v != null);
      const avg = dayValues.length > 0 ? dayValues.reduce((a, b) => a + b, 0) / dayValues.length : null;
      const max = dayValues.length > 0 ? Math.max(...dayValues) : null;
      const min = dayValues.length > 0 ? Math.min(...dayValues) : null;
      const dateStr = hourlyTimes[dayStart] ? hourlyTimes[dayStart].split('T')[0] : null;
      dailyData.push({ date: dateStr, avg, max, min });
    }

    cachedForecastData = dailyData;
    renderForecastCards(dailyData);
    renderForecastChart(cachedForecastHourly);
  } catch (err) {
    console.warn('Forecast fetch failed, using fallback:', err);
    // Fallback data
    const fallback = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const base = 15 + Math.random() * 25;
      fallback.push({
        date: d.toISOString().split('T')[0],
        avg: +base.toFixed(1),
        max: +(base + 5 + Math.random() * 10).toFixed(1),
        min: +(Math.max(5, base - 5 - Math.random() * 5)).toFixed(1),
      });
    }
    cachedForecastData = fallback;
    renderForecastCards(fallback);
    // Generate fake hourly for chart
    const fakeTimes = [], fakePM25 = [];
    for (let i = 0; i < 7 * 24; i++) {
      const d = new Date(today);
      d.setHours(d.getHours() + i);
      fakeTimes.push(d.toISOString().slice(0, 16));
      fakePM25.push(fallback[Math.floor(i / 24)].avg + (Math.random() - 0.5) * 10);
    }
    cachedForecastHourly = { times: fakeTimes, pm25: fakePM25 };
    renderForecastChart(cachedForecastHourly);
  }
}

function renderForecastCards(dailyData) {
  const grid = document.getElementById('forecastCardsGrid');
  if (!grid) return;

  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  grid.innerHTML = dailyData.map((day, i) => {
    if (!day.date || day.avg == null) return '';
    const d = new Date(day.date + 'T00:00:00');
    const dayName = days[d.getDay()];
    const dayNameEn = daysEn[d.getDay()];
    const dateLabel = `${d.getDate()}/${d.getMonth() + 1}`;
    const aqLevel = getAQLevel(day.avg);
    const actInfo = getActivityInfo(day.avg);
    const isToday = i === 0;

    return `
      <div class="forecast-day-card ${aqLevel} ${isToday ? 'today' : ''}">
        <div class="forecast-day-label">${isToday ? 'วันนี้' : dayName}</div>
        <div class="forecast-day-date">${dateLabel} <small>${dayNameEn}</small></div>
        <div class="forecast-day-icon">${actInfo.emoji}</div>
        <div class="forecast-day-pm25">${day.avg.toFixed(0)}</div>
        <div class="forecast-day-unit">µg/m³</div>
        <div class="forecast-day-range">${day.min?.toFixed(0)}–${day.max?.toFixed(0)}</div>
        <div class="forecast-day-activity">${actInfo.label}</div>
        <div class="forecast-day-bar aq-bar-${aqLevel}"></div>
      </div>
    `;
  }).join('');
}

function getActivityInfo(pm25) {
  if (pm25 <= 15) return { emoji: '🏃', label: 'วิ่งได้' };
  if (pm25 <= 25) return { emoji: '🚶', label: 'เดินเล่น' };
  if (pm25 <= 37.5) return { emoji: '😷', label: 'สวมหน้ากาก' };
  if (pm25 <= 75) return { emoji: '🏠', label: 'อยู่ในอาคาร' };
  return { emoji: '⚠️', label: 'อันตราย' };
}

function getChartColors() {
  const isDark = htmlEl.getAttribute('data-theme') === 'dark';
  return {
    text: isDark ? '#a0aec0' : '#4a5568',
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    tooltipBg: isDark ? '#1a2744' : '#ffffff',
    tooltipText: isDark ? '#e8edf5' : '#1a2332',
    tooltipBorder: isDark ? 'rgba(0,188,212,0.3)' : 'rgba(0,0,0,0.1)',
  };
}

function destroyForecastChart() {
  if (forecastChart) { forecastChart.destroy(); forecastChart = null; forecastChartInit = false; }
}

function renderForecastChart(hourlyData) {
  if (!hourlyData) return;
  destroyForecastChart();

  const ctx = document.getElementById('forecastTrendChart');
  if (!ctx) return;
  const colors = getChartColors();

  const labels = hourlyData.times.map(t => {
    const d = new Date(t);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  });

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 340);
  gradient.addColorStop(0, 'rgba(0, 188, 212, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 188, 212, 0.0)');

  forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'PM2.5 (µg/m³)',
        data: hourlyData.pm25,
        borderColor: '#00bcd4',
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#00bcd4',
      }, {
        label: 'WHO Guideline (15 µg/m³)',
        data: Array(hourlyData.pm25.length).fill(15),
        borderColor: 'rgba(239, 83, 80, 0.5)',
        borderWidth: 1.5,
        borderDash: [6, 4],
        fill: false,
        pointRadius: 0,
      }, {
        label: 'Thailand Standard (37.5 µg/m³)',
        data: Array(hourlyData.pm25.length).fill(37.5),
        borderColor: 'rgba(255, 152, 0, 0.5)',
        borderWidth: 1.5,
        borderDash: [6, 4],
        fill: false,
        pointRadius: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: colors.text, font: { size: 11, family: "'Inter', sans-serif" }, usePointStyle: true, padding: 16 }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          cornerRadius: 10,
          padding: 12,
        }
      },
      scales: {
        x: {
          grid: { color: colors.grid, drawBorder: false },
          ticks: { color: colors.text, maxTicksLimit: 14, font: { size: 10, family: "'Inter', sans-serif" } },
        },
        y: {
          grid: { color: colors.grid, drawBorder: false },
          ticks: { color: colors.text, font: { size: 11, family: "'Inter', sans-serif" }, callback: v => v + ' µg/m³' },
          beginAtZero: true,
        }
      }
    }
  });
  forecastChartInit = true;
}

// =============================================
// 10. ML & Benchmark Charts
// =============================================
let modelCompareChart = null;
let featureImportanceChart = null;

function destroyBenchmarkCharts() {
  if (modelCompareChart) { modelCompareChart.destroy(); modelCompareChart = null; }
  if (featureImportanceChart) { featureImportanceChart.destroy(); featureImportanceChart = null; }
  benchmarkChartsInit = false;
}

function initBenchmarkCharts() {
  const colors = getChartColors();

  // Model R² Comparison
  const compareCtx = document.getElementById('modelCompareChart');
  if (compareCtx) {
    modelCompareChart = new Chart(compareCtx, {
      type: 'bar',
      data: {
        labels: ['Linear Regression', 'Decision Tree', 'Random Forest', 'XGBoost / GBM'],
        datasets: [{
          label: 'R² Score',
          data: [0.8437, 0.7899, 0.8254, 0.8209],
          backgroundColor: [
            'rgba(66, 165, 245, 0.7)',
            'rgba(102, 187, 106, 0.7)',
            'rgba(255, 152, 0, 0.7)',
            'rgba(0, 188, 212, 0.85)',
          ],
          borderColor: ['#42a5f5', '#66bb6a', '#ff9800', '#00bcd4'],
          borderWidth: 2,
          borderRadius: 8,
        }, {
          label: 'MAE (lower is better)',
          data: [5.22, 6.26, 5.53, 5.44],
          backgroundColor: [
            'rgba(66, 165, 245, 0.3)',
            'rgba(102, 187, 106, 0.3)',
            'rgba(255, 152, 0, 0.3)',
            'rgba(0, 188, 212, 0.4)',
          ],
          borderColor: ['#42a5f5', '#66bb6a', '#ff9800', '#00bcd4'],
          borderWidth: 1.5,
          borderRadius: 8,
          borderDash: [4, 2],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: colors.text, font: { size: 11, family: "'Inter', sans-serif" }, usePointStyle: true, padding: 16 }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            cornerRadius: 10,
            padding: 12,
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.text, font: { size: 10, weight: '600', family: "'Inter', sans-serif" } }
          },
          y: {
            grid: { color: colors.grid, drawBorder: false },
            ticks: { color: colors.text, font: { size: 11, family: "'Inter', sans-serif" } },
            beginAtZero: true,
          }
        }
      }
    });
  }

  // Feature Importance
  const fiCtx = document.getElementById('featureImportanceChart');
  if (fiCtx) {
    const featureNames = [
      'PM2.5_lag1', 'PM2.5_lag7', 'Temperature', 'Humidity',
      'Wind Speed', 'Month', 'PM10', 'Season',
      'DayOfYear', 'PM2.5_rolling7'
    ].reverse();

    const importances = [0.342, 0.189, 0.098, 0.087, 0.072, 0.058, 0.052, 0.041, 0.033, 0.028].reverse();

    featureImportanceChart = new Chart(fiCtx, {
      type: 'bar',
      data: {
        labels: featureNames,
        datasets: [{
          label: 'Importance',
          data: importances,
          backgroundColor: importances.map((_, i) => {
            const alpha = 0.4 + (i / importances.length) * 0.5;
            return `rgba(0, 188, 212, ${alpha})`;
          }),
          borderColor: '#00bcd4',
          borderWidth: 1.5,
          borderRadius: 6,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            cornerRadius: 10,
            padding: 12,
            callbacks: {
              label: ctx => ` Importance: ${(ctx.parsed.x * 100).toFixed(1)}%`
            }
          }
        },
        scales: {
          x: {
            grid: { color: colors.grid, drawBorder: false },
            ticks: {
              color: colors.text,
              font: { size: 11, family: "'Inter', sans-serif" },
              callback: v => (v * 100).toFixed(0) + '%'
            },
            beginAtZero: true,
          },
          y: {
            grid: { display: false },
            ticks: { color: colors.text, font: { size: 10, weight: '600', family: "'Inter', sans-serif" } }
          }
        }
      }
    });
  }

  benchmarkChartsInit = true;
}

// =============================================
// 11. Keyboard & Misc
// =============================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('navLinks').classList.remove('show');
  }
});

document.addEventListener('click', (e) => {
  const nav = document.getElementById('navLinks');
  const toggle = document.getElementById('mobileToggle');
  if (!nav.contains(e.target) && !toggle.contains(e.target)) {
    nav.classList.remove('show');
  }
});

// =============================================
// 12. GitHub Repository Clone Helper
// =============================================
function copyRepoClone(btn) {
  const repoUrl = 'git clone https://github.com/airguard-ai/airguard-platform.git';
  navigator.clipboard.writeText(repoUrl).then(() => {
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check" style="color:#27c93f;"></i>';
    btn.setAttribute('title', 'คัดลอกสำเร็จ!');
    setTimeout(() => {
      btn.innerHTML = originalHtml;
      btn.setAttribute('title', 'คัดลอกคำสั่ง Git Clone');
    }, 2000);
  }).catch(() => {
    prompt('คัดลอกคำสั่ง Git Clone:', repoUrl);
  });
}


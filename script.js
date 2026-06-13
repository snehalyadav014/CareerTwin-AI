/**
 * CareerTwin AI – script.js
 * Handles: form validation, API calls, dynamic UI rendering, animations
 * Backend: http://localhost:8080
 * Fallback: simulation mode when backend is offline
 */

'use strict';

/* ============================================================
   CONFIG
   ============================================================ */
const API_BASE = 'http://localhost:8080/api';

const ENDPOINTS = {
  health:        `${API_BASE}/health`,
  analyzeResume: `${API_BASE}/analyze-resume`,
  readiness:     `${API_BASE}/readiness-score`,
  roadmap:       `${API_BASE}/roadmap`,
  adminStats:    `${API_BASE}/admin/stats`,
};

/* ============================================================
   UTILITY: Toast Notification
   ============================================================ */
function showToast(message, type = 'info', duration = 3500) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = 'toast'; }, duration);
}

/* ============================================================
   UTILITY: Set button loading state
   ============================================================ */
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const text   = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  if (loading) {
    btn.disabled = true;
    if (text)   text.style.display   = 'none';
    if (loader) loader.style.display = 'inline-flex';
  } else {
    btn.disabled = false;
    if (text)   text.style.display   = '';
    if (loader) loader.style.display = 'none';
  }
}

/* ============================================================
   UTILITY: Animate number
   ============================================================ */
function animateNumber(el, target, duration = 1200, suffix = '') {
  if (!el) return;
  const start = performance.now();
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ============================================================
   UTILITY: Animate progress bar
   ============================================================ */
function animateBar(barEl, valueEl, percent, delay = 0) {
  setTimeout(() => {
    if (barEl) barEl.style.width = percent + '%';
    if (valueEl) {
      animateNumber(valueEl, percent, 1000, '%');
    }
  }, delay);
}

/* ============================================================
   UTILITY: Generic fetch with fallback simulation
   ============================================================ */
async function apiFetch(url, options = {}, mockData = null) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`[CareerTwin] API unavailable (${url}). Using simulation.`, err.message);
    if (mockData) return mockData;
    throw err;
  }
}

/* ============================================================
   HEALTH CHECK
   ============================================================ */
async function checkHealth() {
  const dot  = document.querySelector('.status-dot');
  const text = document.querySelector('.status-text');
  try {
    const data = await apiFetch(ENDPOINTS.health, { method: 'GET' }, null);
    dot.className  = 'status-dot online';
    text.textContent = 'API Online';
    showToast('Backend connected successfully', 'success');
  } catch {
    dot.className  = 'status-dot offline';
    text.textContent = 'Simulation Mode';
    // Don't show error — simulation mode is graceful fallback
  }
}

/* ============================================================
   FORM VALIDATION
   ============================================================ */
function validateField(id, errorId, message) {
  const input = document.getElementById(id);
  const error = document.getElementById(errorId);
  const value = input ? input.value.trim() : '';
  if (!value) {
    if (input)  input.classList.add('invalid');
    if (error)  error.textContent = message;
    return false;
  }
  if (input)  input.classList.remove('invalid');
  if (error)  error.textContent = '';
  return true;
}

function validateForm() {
  const nameOk    = validateField('studentName', 'nameError',   'Name is required');
  const branchOk  = validateField('branch',      'branchError', 'Please select a branch');
  const yearOk    = validateField('year',         'yearError',   'Please select your year');
  const skillsOk  = validateField('skills',       'skillsError', 'Enter at least one skill');
  return nameOk && branchOk && yearOk && skillsOk;
}

function getProfilePayload() {
  return {
    name:   document.getElementById('studentName')?.value.trim(),
    branch: document.getElementById('branch')?.value,
    year:   document.getElementById('year')?.value,
    skills: document.getElementById('skills')?.value.split(',').map(s => s.trim()).filter(Boolean),
  };
}

/* ============================================================
   ANALYZE RESUME
   ============================================================ */
const MOCK_ANALYZE = {
  resumeScore: 88,
  strengths: ['Java', 'Spring Boot', 'Problem Solving', 'REST APIs', 'SQL'],
  missingSkills: ['Azure AI', 'Docker', 'Kubernetes', 'CI/CD Pipelines'],
};

const INDUSTRY_DEMAND = [
  { skill: 'Cloud (Azure/AWS)',    level: 92 },
  { skill: 'Containerization',     level: 85 },
  { skill: 'AI/ML Integration',    level: 78 },
  { skill: 'Spring Boot',          level: 95 },
  { skill: 'React / Angular',      level: 80 },
];

async function analyzeResume() {
  if (!validateForm()) {
    showToast('Please fill all required fields', 'error');
    return;
  }

  setLoading('analyzeBtn', true);
  const payload = getProfilePayload();

  try {
    const data = await apiFetch(
      ENDPOINTS.analyzeResume,
      { method: 'POST', body: JSON.stringify(payload) },
      MOCK_ANALYZE
    );
    renderAnalysis(data);
    showToast(`Resume analyzed · Score: ${data.resumeScore}%`, 'success');
  } catch (err) {
    showToast('Analysis failed. Please try again.', 'error');
    console.error('[CareerTwin] analyzeResume error:', err);
  } finally {
    setLoading('analyzeBtn', false);
  }
}

function renderAnalysis(data) {
  // Show section
  document.getElementById('analysisPlaceholder')?.classList.add('hidden');
  const result = document.getElementById('resumeAnalysisResult');
  result?.classList.remove('hidden');

  // Strengths
  const strengthsList = document.getElementById('strengthsList');
  if (strengthsList) {
    strengthsList.innerHTML = (data.strengths || [])
      .map(s => `<span class="tag strength">${s}</span>`)
      .join('');
  }

  // Missing Skills
  const missingList = document.getElementById('missingSkillsList');
  if (missingList) {
    missingList.innerHTML = (data.missingSkills || [])
      .map(s => `<span class="tag missing">${s}</span>`)
      .join('');
  }

  // Industry Demand
  const demandList = document.getElementById('industryDemandList');
  if (demandList) {
    demandList.innerHTML = INDUSTRY_DEMAND.map(item => `
      <div class="demand-item">
        <div class="demand-label">
          <span>${item.skill}</span>
          <span class="demand-level">${item.level}%</span>
        </div>
        <div class="demand-bar">
          <div class="demand-bar-fill" style="width:0%" data-width="${item.level}%"></div>
        </div>
      </div>
    `).join('');
    // Animate bars
    setTimeout(() => {
      document.querySelectorAll('.demand-bar-fill').forEach(bar => {
        bar.style.width = bar.getAttribute('data-width');
      });
    }, 100);
  }

  // Scroll to analysis
  document.getElementById('analysis')?.scrollIntoView({ behavior: 'smooth' });
}

/* ============================================================
   CHECK READINESS
   ============================================================ */
const MOCK_READINESS = {
  readinessScore:    82,
  skillMatch:        85,
  resumeQuality:     88,
  interviewReadiness: 74,
};

async function checkReadiness() {
  if (!validateForm()) {
    showToast('Please fill your profile first', 'error');
    return;
  }

  const btn = document.getElementById('readinessBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Checking...'; }

  const payload = getProfilePayload();

  try {
    const data = await apiFetch(
      ENDPOINTS.readiness,
      { method: 'POST', body: JSON.stringify(payload) },
      MOCK_READINESS
    );
    renderReadiness(data);
    showToast(`Readiness Score: ${data.readinessScore} / 100`, 'success');
  } catch (err) {
    showToast('Could not calculate readiness.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Check Readiness'; }
  }
}

function renderReadiness(data) {
  const { readinessScore, skillMatch, resumeQuality, interviewReadiness } = data;

  // Mini stats in form panel
  document.getElementById('overallScore').textContent = readinessScore;
  const statSub = document.querySelector('.stat-card-sub');
  if (statSub) statSub.textContent = getReadinessLabel(readinessScore);
  animateBar(document.getElementById('skillMatchBar'),  document.getElementById('skillMatchVal'),  skillMatch,          100);
  animateBar(document.getElementById('resumeQualBar'),  document.getElementById('resumeQualVal'),  resumeQuality,       200);
  animateBar(document.getElementById('interviewBar'),   document.getElementById('interviewVal'),   interviewReadiness,  300);

  // Full readiness section
  document.getElementById('readinessPlaceholder')?.classList.add('hidden');
  const result = document.getElementById('readinessResult');
  result?.classList.remove('hidden');

  // Radial chart
  const circumference = 314;
  const offset = circumference - (readinessScore / 100) * circumference;
  const radialEl = document.getElementById('radialCircle');
  if (radialEl) {
    setTimeout(() => { radialEl.style.strokeDashoffset = offset; }, 100);
  }
  const scoreEl = document.getElementById('radialScore');
  animateNumber(scoreEl, readinessScore, 1200);

  const labelEl = document.getElementById('readinessLabel');
  if (labelEl) labelEl.textContent = getReadinessLabel(readinessScore);

  // Metric bars
  animateBar(document.getElementById('smBar'),  document.getElementById('smValue'),  skillMatch,          150);
  animateBar(document.getElementById('rqBar'),  document.getElementById('rqValue'),  resumeQuality,       300);
  animateBar(document.getElementById('irBar'),  document.getElementById('irValue'),  interviewReadiness,  450);

  document.getElementById('scoreSection')?.scrollIntoView({ behavior: 'smooth' });
}

function getReadinessLabel(score) {
  if (score >= 90) return '🏆 Highly Placement Ready';
  if (score >= 75) return '✅ Placement Ready';
  if (score >= 60) return '⚡ Almost Ready';
  if (score >= 40) return '📚 Needs Improvement';
  return '🌱 Early Stage';
}

/* ============================================================
   GENERATE ROADMAP
   ============================================================ */
const MOCK_ROADMAP = {
  roadmap: [
    { level: 'Beginner',     course: 'Java Fundamentals',          duration: '4 weeks', icon: '🌱' },
    { level: 'Beginner',     course: 'Data Structures & Algorithms',duration: '6 weeks', icon: '📚' },
    { level: 'Intermediate', course: 'Spring Boot Development',     duration: '5 weeks', icon: '🚀' },
    { level: 'Intermediate', course: 'REST API Design',             duration: '3 weeks', icon: '🔗' },
    { level: 'Advanced',     course: 'Azure AI Services',           duration: '6 weeks', icon: '🤖' },
    { level: 'Advanced',     course: 'Docker & Kubernetes',         duration: '4 weeks', icon: '🐳' },
  ],
};

async function generateRoadmap() {
  if (!validateForm()) {
    showToast('Please fill your profile first', 'error');
    return;
  }

  const btn = document.getElementById('roadmapBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Generating...'; }

  const payload = getProfilePayload();

  try {
    const data = await apiFetch(
      ENDPOINTS.roadmap,
      { method: 'POST', body: JSON.stringify(payload) },
      MOCK_ROADMAP
    );
    renderRoadmap(data);
    showToast('Learning roadmap generated!', 'success');
  } catch (err) {
    showToast('Could not generate roadmap.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Generate Roadmap'; }
  }
}

function renderRoadmap(data) {
  document.getElementById('roadmapPlaceholder')?.classList.add('hidden');
  const container = document.getElementById('roadmapResult');
  if (!container) return;
  container.classList.remove('hidden');

  const items = data.roadmap || [];
  container.innerHTML = items.map((item, i) => {
    const levelClass = item.level.toLowerCase();
    return `
      <div class="roadmap-node" style="animation-delay:${i * 0.12}s">
        <div class="roadmap-dot"></div>
        <div class="roadmap-card">
          <div class="roadmap-level ${levelClass}">${item.icon || '•'} ${item.level}</div>
          <div class="roadmap-course">${item.course}</div>
          ${item.duration ? `<div style="font-size:0.75rem;color:var(--c-text-muted);margin-top:6px">⏱ ${item.duration}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' });
}

/* ============================================================
   ADMIN STATS
   ============================================================ */
const MOCK_ADMIN = {
  totalStudents:  500,
  placementReady: 275,
  averageScore:   78,
  gapReports:     142,
};

async function loadAdminStats() {
  const btn = document.querySelector('[onclick="loadAdminStats()"]');
  if (btn) btn.textContent = 'Refreshing...';

  try {
    const data = await apiFetch(
      ENDPOINTS.adminStats,
      { method: 'GET' },
      MOCK_ADMIN
    );
    renderAdminStats(data);
    showToast('Admin stats refreshed', 'success');
  } catch (err) {
    showToast('Could not load admin stats.', 'error');
  } finally {
    if (btn) btn.textContent = 'Refresh Stats';
  }
}

function renderAdminStats(data) {
  const totalEl  = document.getElementById('totalStudents');
  const readyEl  = document.getElementById('placementReady');
  const avgEl    = document.getElementById('avgScore');
  const gapEl    = document.getElementById('gapReports');

  animateNumber(totalEl,  data.totalStudents  || 0, 1000);
  animateNumber(readyEl,  data.placementReady || 0, 1000);
  animateNumber(avgEl,    data.averageScore   || 0, 1000);
  animateNumber(gapEl,    data.gapReports     || 142, 1000);
}

/* ============================================================
   FILE HANDLING
   ============================================================ */
function handleFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    showToast('File too large. Max 5MB.', 'error');
    event.target.value = '';
    return;
  }

  const allowed = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowed.includes(file.type)) {
    showToast('Only PDF or Word documents are accepted.', 'error');
    event.target.value = '';
    return;
  }

  document.getElementById('fileSelected').style.display = 'flex';
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileDrop').style.display = 'none';
}

function removeFile() {
  document.getElementById('resumeFile').value = '';
  document.getElementById('fileSelected').style.display = 'none';
  document.getElementById('fileDrop').style.display = 'block';
}

/* ============================================================
   DRAG & DROP on file area
   ============================================================ */
function initDragDrop() {
  const dropZone = document.getElementById('fileDrop');
  if (!dropZone) return;

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--c-purple)';
    dropZone.style.background  = 'rgba(124,58,237,0.08)';
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '';
    dropZone.style.background  = '';
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '';
    dropZone.style.background  = '';
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fileInput = document.getElementById('resumeFile');
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      handleFileSelect({ target: fileInput });
    }
  });
}

/* ============================================================
   NAVIGATION SCROLL
   ============================================================ */
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/* ============================================================
   SVG GRADIENT INJECTION (for radial chart)
   ============================================================ */
function injectSvgGradient() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'svg-defs');
  svg.innerHTML = `
    <defs>
      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#7c3aed"/>
        <stop offset="50%"  stop-color="#2563eb"/>
        <stop offset="100%" stop-color="#14b8a6"/>
      </linearGradient>
    </defs>
  `;
  document.body.prepend(svg);
}

/* ============================================================
   EXPORT REPORT (placeholder)
   ============================================================ */
function exportReport() {
  showToast('Report export — connect backend for file generation', 'info');
}

/* ============================================================
   NAVBAR ACTIVE LINK on scroll
   ============================================================ */
function initScrollSpy() {
  const sections = ['hero', 'dashboard', 'analysis', 'roadmap', 'careers', 'admin'];
  const links = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(link => {
          link.style.color = link.getAttribute('href') === `#${id}`
            ? 'var(--c-text-primary)'
            : '';
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  injectSvgGradient();
  initDragDrop();
  initScrollSpy();
  checkHealth();
  loadAdminStats(); // Load admin stats on page start
});
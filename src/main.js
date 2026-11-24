import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CONFIG, buildWhatsAppUrl } from './config.js';
import { TRANSLATIONS } from './i18n.js';
import { initScene3D } from './scene3d.js';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

// App state (Locked to Ferah / Editorial theme & Kelime Kartları 3D scene)
const state = {
  lang: localStorage.getItem('eda_lang') === 'en' ? 'en' : 'tr',
  theme: 'editorial',
  quizIndex: 0,
  quizAnswers: [],
  quizFinished: false,
  selectedProgram: 'speaking',
  selectedLevelIndex: 0,
  submittedData: null,
};

initScene3D(document.getElementById('bg-3d'));

// Toast helper
let toastTimer = null;
function showToast(message) {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3600);
}

// Nested translation lookup
function t(path) {
  return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), TRANSLATIONS[state.lang]);
}

// Apply locked Ferah theme
function applyTheme() {
  state.theme = 'editorial';
  document.documentElement.setAttribute('data-theme', 'editorial');
}

// Apply 3D mouse tilt & glare to cards
function attachTiltListeners() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  document.querySelectorAll('.tilt-card').forEach((card) => {
    if (card.dataset.tiltBound === '1') return;
    card.dataset.tiltBound = '1';

    const maxTilt = card.id === 'portrait-card' ? 11 : 6;

    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - y) * maxTilt * 2;

      card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

// Subtle magnetic hover on primary CTA buttons
function attachMagneticButtons() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.magnetic').forEach((btn) => {
    if (btn.dataset.magBound === '1') return;
    btn.dataset.magBound = '1';

    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.16;
      const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.16;
      btn.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
    });
  });
}

// Render static data-i18n attributes
function renderStaticTranslations() {
  const dict = TRANSLATIONS[state.lang];
  document.title = dict.metaTitle;
  document.documentElement.lang = state.lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const val = t(el.dataset.i18n);
    if (typeof val === 'string') el.textContent = val;
  });

  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const val = t(el.dataset.i18nHtml);
    if (typeof val === 'string') el.innerHTML = val;
  });

  document.querySelectorAll('[data-set-lang]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.setLang === state.lang);
  });
}

function renderHeroStats() {
  const stats = t('hero.stats');
  const container = document.getElementById('hero-stats');
  container.innerHTML = stats
    .map(
      (s) => `
      <div class="stat-item">
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>`
    )
    .join('');
}

function renderMilestones() {
  const items = t('about.milestones');
  const container = document.getElementById('milestones-grid');
  container.innerHTML = items
    .map(
      (m) => `
      <article class="glass-card tilt-card reveal-card">
        <div class="card-glare"></div>
        <div class="milestone-step">${m.step}</div>
        <h3 class="card-title">${m.title}</h3>
        <p class="card-desc">${m.desc}</p>
      </article>`
    )
    .join('');
}

function renderPrograms() {
  const items = t('programs.items');
  const btnText = t('programs.selectBtn');
  const container = document.getElementById('programs-grid');

  container.innerHTML = items
    .map(
      (p) => `
      <article class="glass-card tilt-card program-card reveal-card">
        <div class="card-glare"></div>
        <div>
          <span class="program-badge">${p.badge}</span>
          <h3 class="card-title">${p.title}</h3>
          <p class="card-desc">${p.desc}</p>
          <ul class="program-bullets">
            ${p.bullets.map((b) => `<li>${b}</li>`).join('')}
          </ul>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" data-select-program="${p.id}">
          ${btnText} →
        </button>
      </article>`
    )
    .join('');

  container.querySelectorAll('[data-select-program]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedProgram = btn.dataset.selectProgram;
      state.submittedData = null;
      renderBookingForm();
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function renderProcess() {
  const steps = t('process.steps');
  const container = document.getElementById('process-grid');
  container.innerHTML = steps
    .map(
      (s) => `
      <article class="glass-card tilt-card reveal-card">
        <div class="card-glare"></div>
        <div class="process-num">${s.num}</div>
        <h3 class="card-title">${s.title}</h3>
        <p class="card-desc">${s.desc}</p>
      </article>`
    )
    .join('');
}

function computeQuizBand(score) {
  if (score <= 3) return 'A2';
  if (score <= 6) return 'B1';
  if (score <= 8) return 'B2';
  return 'C1';
}

function renderQuiz() {
  const quiz = t('quiz');
  const shell = document.getElementById('quiz-shell');
  if (!shell) return;

  if (!state.quizFinished) {
    const qObj = quiz.questions[state.quizIndex];
    const progressPct = ((state.quizIndex + 1) / quiz.questions.length) * 100;

    shell.innerHTML = `
      <div class="quiz-top">
        <span class="quiz-progress-text">${quiz.questionLabel} ${state.quizIndex + 1} / ${quiz.questions.length}</span>
        <div class="quiz-bar">
          <div class="quiz-bar-fill" style="width: ${progressPct}%"></div>
        </div>
      </div>
      <h3 class="quiz-question">${qObj.q}</h3>
      <div class="quiz-options">
        ${qObj.options
          .map(
            (opt, idx) => `
            <button type="button" class="quiz-option" data-quiz-opt="${idx}">
              ${opt}
            </button>`
          )
          .join('')}
      </div>
    `;

    shell.querySelectorAll('[data-quiz-opt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const chosen = Number(btn.dataset.quizOpt);
        state.quizAnswers[state.quizIndex] = chosen;
        btn.classList.add('selected');

        setTimeout(() => {
          if (state.quizIndex < quiz.questions.length - 1) {
            state.quizIndex += 1;
          } else {
            state.quizFinished = true;
          }
          renderQuiz();
        }, 180);
      });
    });
    return;
  }

  // Score calculation
  const score = quiz.questions.reduce((acc, q, idx) => {
    return acc + (state.quizAnswers[idx] === q.answer ? 1 : 0);
  }, 0);

  const bandKey = computeQuizBand(score);
  const band = quiz.bands[bandKey];
  const waShareMsg =
    state.lang === 'tr'
      ? `Merhaba Teacher Eda! Sitedeki seviye testini çözdüm (${score}/${quiz.questions.length} doğru · ${band.level}). Online tanışma dersi planlamak istiyorum.`
      : `Hi Teacher Eda! I just took the level check on your website (${score}/${quiz.questions.length} correct · ${band.level}). I'd love to book a free trial lesson.`;

  const dotsHtml = quiz.questions
    .map((q, idx) => {
      const ok = state.quizAnswers[idx] === q.answer;
      return `<span class="quiz-dot ${ok ? 'correct' : 'missed'}" title="${quiz.questionLabel} ${idx + 1}">${idx + 1}</span>`;
    })
    .join('');

  const waUrl = buildWhatsAppUrl(waShareMsg);
  const waButtonHtml = waUrl
    ? `<a href="${waUrl}" class="btn btn-ghost">${quiz.shareWaBtn}</a>`
    : '';

  shell.innerHTML = `
    <span class="quiz-result-band">${band.level}</span>
    <h3 class="quiz-question">${quiz.scoreText}: ${score} / ${quiz.questions.length}</h3>
    <p class="card-desc">${band.summary}</p>
    <div class="quiz-dots">${dotsHtml}</div>
    <div class="quiz-result-actions">
      <button type="button" class="btn btn-primary" id="quiz-apply-btn">${quiz.applyBtn}</button>
      ${waButtonHtml}
      <button type="button" class="btn btn-ghost" id="quiz-restart-btn">${quiz.restartBtn}</button>
    </div>
  `;

  document.getElementById('quiz-apply-btn')?.addEventListener('click', () => {
    const levelMap = { A2: 2, B1: 3, B2: 4, C1: 5 };
    state.selectedLevelIndex = levelMap[bandKey] ?? 0;
    state.selectedProgram = band.recommendedProgram;
    state.submittedData = null;
    renderBookingForm();
    showToast(quiz.appliedToast);
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('quiz-restart-btn')?.addEventListener('click', () => {
    state.quizIndex = 0;
    state.quizAnswers = [];
    state.quizFinished = false;
    renderQuiz();
  });
}

function renderTestimonials() {
  const items = t('testimonials.items');
  const container = document.getElementById('testimonials-grid');
  container.innerHTML = items
    .map(
      (item) => `
      <article class="glass-card tilt-card reveal-card">
        <div class="card-glare"></div>
        <div class="quote-mark">“</div>
        <p class="testimonial-quote">${item.quote}</p>
        <div class="testimonial-author">${item.name}</div>
        <div class="testimonial-role">${item.role}</div>
      </article>`
    )
    .join('');
}

function renderFaq() {
  const items = t('faq.items');
  const container = document.getElementById('faq-list');
  container.innerHTML = items
    .map(
      (item, idx) => `
      <div class="faq-item ${idx === 0 ? 'open' : ''}">
        <button type="button" class="faq-trigger" aria-expanded="${idx === 0 ? 'true' : 'false'}">
          <span>${item.q}</span>
          <span class="faq-icon">+</span>
        </button>
        <div class="faq-panel">
          <div class="faq-panel-inner">
            <p class="faq-answer">${item.a}</p>
          </div>
        </div>
      </div>`
    )
    .join('');

  container.querySelectorAll('.faq-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const parent = trigger.closest('.faq-item');
      const isOpen = parent.classList.toggle('open');
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });
}

function renderContactChannels() {
  const waLink = document.getElementById('wa-direct-link');
  const emailLink = document.getElementById('email-direct-link');
  const igLink = document.getElementById('ig-direct-link');
  const comingSoon = t('contact.comingSoon');
  const waUrl = buildWhatsAppUrl(t('contact.waDefaultMsg'));

  if (waLink) {
    if (waUrl) {
      waLink.href = waUrl;
      waLink.textContent = t('contact.waBtn');
      waLink.classList.remove('btn-disabled');
      waLink.removeAttribute('aria-disabled');
    } else {
      waLink.removeAttribute('href');
      waLink.textContent = comingSoon;
      waLink.classList.add('btn-disabled');
      waLink.setAttribute('aria-disabled', 'true');
    }
  }

  if (emailLink) {
    if (CONFIG.email) {
      emailLink.href = `mailto:${CONFIG.email}`;
      emailLink.textContent = CONFIG.email;
      emailLink.classList.remove('channel-placeholder');
      emailLink.classList.add('channel-value');
    } else {
      emailLink.removeAttribute('href');
      emailLink.textContent = comingSoon;
      emailLink.classList.remove('channel-value');
      emailLink.classList.add('channel-placeholder');
    }
  }

  if (igLink) {
    if (CONFIG.instagramHandle && CONFIG.instagramUrl) {
      igLink.href = CONFIG.instagramUrl;
      igLink.target = '_blank';
      igLink.rel = 'noopener noreferrer';
      igLink.textContent = CONFIG.instagramHandle;
      igLink.classList.remove('channel-placeholder');
      igLink.classList.add('channel-value');
    } else {
      igLink.removeAttribute('href');
      igLink.removeAttribute('target');
      igLink.removeAttribute('rel');
      igLink.textContent = comingSoon;
      igLink.classList.remove('channel-value');
      igLink.classList.add('channel-placeholder');
    }
  }
}

function renderBookingForm() {
  const f = t('contact.form');
  const programs = t('programs.items');
  const container = document.getElementById('booking-card');
  if (!container) return;

  if (state.submittedData) {
    const d = state.submittedData;
    const msg =
      state.lang === 'tr'
        ? `Merhaba Teacher Eda! Ücretsiz online tanışma dersi talep ediyorum.\n• Ad: ${d.name}\n• İletişim: ${d.contact}\n• Program: ${d.programTitle}\n• Seviye: ${d.level}\n• Zaman: ${d.time}\n• Not: ${d.note || '-'}`
        : `Hi Teacher Eda! I would like to book a free online trial lesson.\n• Name: ${d.name}\n• Contact: ${d.contact}\n• Program: ${d.programTitle}\n• Level: ${d.level}\n• Time: ${d.time}\n• Note: ${d.note || '-'}`;

    const mailSubject =
      state.lang === 'tr'
        ? `Online Tanışma Dersi Talebi — ${d.name}`
        : `Free Online Trial Request — ${d.name}`;

    const waUrl = buildWhatsAppUrl(msg);
    const hasChannels = Boolean(waUrl || CONFIG.email);
    const waAction = waUrl ? `<a href="${waUrl}" class="btn btn-primary">${f.sendWaBtn}</a>` : '';
    const mailAction = CONFIG.email
      ? `<a href="mailto:${CONFIG.email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(msg)}" class="btn btn-ghost">${f.sendMailBtn}</a>`
      : '';

    container.innerHTML = `
      <div class="form-success">
        <h3>${f.successTitle}</h3>
        <p class="card-desc">${hasChannels ? f.successDesc : f.previewSuccessDesc}</p>
        ${!hasChannels ? `<div class="form-summary-preview">${msg}</div>` : ''}
        <div class="form-success-actions">
          ${waAction}
          ${mailAction}
          ${!hasChannels ? `<button type="button" class="btn btn-primary" id="form-copy-btn">${f.copyBtn}</button>` : ''}
          <button type="button" class="btn btn-ghost" id="form-reset-btn">${f.resetBtn}</button>
        </div>
      </div>
    `;

    document.getElementById('form-copy-btn')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(msg);
        showToast(f.copiedToast);
      } catch {
        showToast(f.copiedToast);
      }
    });

    document.getElementById('form-reset-btn')?.addEventListener('click', () => {
      state.submittedData = null;
      renderBookingForm();
    });
    return;
  }

  container.innerHTML = `
    <form class="booking-form" id="trial-booking-form" novalidate>
      <div class="field">
        <label for="f-name">${f.nameLabel}</label>
        <input id="f-name" name="name" type="text" placeholder="${f.namePlaceholder}" required />
      </div>
      <div class="field">
        <label for="f-contact">${f.contactLabel}</label>
        <input id="f-contact" name="contact" type="text" placeholder="${f.contactPlaceholder}" required />
      </div>
      <div class="field">
        <label for="f-program">${f.programLabel}</label>
        <select id="f-program" name="program">
          ${programs
            .map(
              (p) =>
                `<option value="${p.id}" ${p.id === state.selectedProgram ? 'selected' : ''}>${p.title}</option>`
            )
            .join('')}
        </select>
      </div>
      <div class="field">
        <label for="f-level">${f.levelLabel}</label>
        <select id="f-level" name="level">
          ${f.levelOptions
            .map(
              (lvl, idx) =>
                `<option value="${lvl}" ${idx === state.selectedLevelIndex ? 'selected' : ''}>${lvl}</option>`
            )
            .join('')}
        </select>
      </div>
      <div class="field full">
        <label for="f-time">${f.timeLabel}</label>
        <select id="f-time" name="time">
          ${f.timeOptions.map((opt) => `<option value="${opt}">${opt}</option>`).join('')}
        </select>
      </div>
      <div class="field full">
        <label for="f-note">${f.noteLabel}</label>
        <textarea id="f-note" name="note" rows="3" placeholder="${f.notePlaceholder}"></textarea>
      </div>
      <div class="field full">
        <button type="submit" class="btn btn-primary">${f.submitBtn}</button>
      </div>
    </form>
  `;

  document.getElementById('trial-booking-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const contact = String(formData.get('contact') || '').trim();
    if (!name || !contact) {
      showToast(f.errorRequired);
      return;
    }
    const programId = String(formData.get('program') || 'speaking');
    const programObj = programs.find((p) => p.id === programId) || programs[0];

    state.submittedData = {
      name,
      contact,
      programId,
      programTitle: programObj.title,
      level: String(formData.get('level') || ''),
      time: String(formData.get('time') || ''),
      note: String(formData.get('note') || '').trim(),
    };
    renderBookingForm();
  });
}

// GSAP Entrance & Scroll Animations
function initAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.from('.hero-anim', {
    y: 26,
    opacity: 0,
    duration: 0.78,
    stagger: 0.08,
    ease: 'power3.out',
    clearProps: 'transform,opacity',
  });

  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.from(el, {
      y: 28,
      opacity: 0,
      duration: 0.7,
      ease: 'power2.out',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: el,
        start: 'top 86%',
        once: true,
      },
    });
  });

  gsap.utils.toArray('.reveal-card').forEach((card, index) => {
    gsap.from(card, {
      y: 24,
      opacity: 0,
      duration: 0.65,
      delay: (index % 4) * 0.06,
      ease: 'power2.out',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        once: true,
      },
    });
  });
}

// Render all dynamic views
function renderAll() {
  renderStaticTranslations();
  renderHeroStats();
  renderMilestones();
  renderPrograms();
  renderProcess();
  renderQuiz();
  renderTestimonials();
  renderFaq();
  renderContactChannels();
  renderBookingForm();
  attachTiltListeners();
  attachMagneticButtons();
}

// Bind global controls
document.querySelectorAll('[data-set-lang]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const nextLang = btn.dataset.setLang === 'en' ? 'en' : 'tr';
    if (nextLang === state.lang) return;
    state.lang = nextLang;
    localStorage.setItem('eda_lang', state.lang);
    renderAll();
  });
});

const mobileToggle = document.getElementById('mobile-menu-toggle');
const mobileDrawer = document.getElementById('mobile-drawer');
mobileToggle?.addEventListener('click', () => {
  const open = mobileDrawer.classList.toggle('open');
  mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});
mobileDrawer?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileDrawer.classList.remove('open');
    mobileToggle?.setAttribute('aria-expanded', 'false');
  });
});

// Boot
applyTheme();
renderAll();
initAnimations();

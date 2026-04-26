/* ============================================
   CONTENT DECISION LAYER — Application Logic
   ============================================ */

// ============================================
// SCORING WEIGHTS — edit these to change prioritization
// ============================================
const SCORING_WEIGHTS = {
  brandFit: 0.35,
  uniqueness: 0.20,
  easeOfCapture: 0.15,
  easeOfExecution: 0.15,
  weekRelevance: 0.15,
};

// ============================================
// AE LEVEL MAP — format → default AE level
// ============================================
const AE_MAP = {
  'short text post': 1,
  'photo + caption': 2,
  'carousel': 3,
  'talking video': 3,
  'voiceover': 4,
  'capture only': 1,
};

// ============================================
// SEEDED BRAND DEFAULTS — edit to change initial brand profile
// ============================================
const DEFAULT_BRAND = {
  pillars: 'disciplined ambition\nwellness\nsystems\ntaste\nperspective',
  tone: 'sharp\ncalm\nobservant\nprofessional\nunderstated',
  avoid: 'cringe motivation\ngeneric hustle\nfake guru energy\noverly bro\nlow-signal posting',
  audience: 'ambitious professionals\nwellness-minded operators\npeople who value taste and discipline\nquiet high-performers',
  reputation: 'thoughtful\ndisciplined\nhigh taste\nclear thinker\nquietly aspirational',
};

// ============================================
// SEEDED WEEK DATA
// ============================================
const DEFAULT_WEEK = {
  label: 'Mexico City Week',
  city: 'Mexico City',
  notes: 'Remote work, fitness, dinners, social plans, city exploration. Good energy but not overextending.',
  energy: 'medium',
  targetPosts: 3,
  effort: 'balanced',
};

const DEFAULT_ACTIVITIES = [
  { type: 'Gym', frequency: '4x', tags: 'fitness, discipline, routine', visual: 3, insight: 3, ease: 4 },
  { type: 'Run', frequency: '1x', tags: 'fitness, movement, city', visual: 4, insight: 3, ease: 3 },
  { type: 'Remote work', frequency: '5x', tags: 'work, systems, focus', visual: 2, insight: 4, ease: 4 },
  { type: 'Coffee walk', frequency: '4x', tags: 'lifestyle, city, taste', visual: 4, insight: 3, ease: 5 },
  { type: 'Restaurant', frequency: '2x', tags: 'taste, social, city', visual: 5, insight: 2, ease: 4 },
  { type: 'Rooftop', frequency: '1x', tags: 'city, perspective, visual', visual: 5, insight: 3, ease: 4 },
  { type: 'Social dinner', frequency: '2x', tags: 'social, lifestyle, taste', visual: 3, insight: 3, ease: 3 },
  { type: 'Travel / airport', frequency: '1x', tags: 'travel, perspective, transition', visual: 3, insight: 4, ease: 3 },
  { type: 'Recovery / quiet routine', frequency: '2x', tags: 'wellness, recovery, discipline', visual: 2, insight: 4, ease: 5 },
];

// ============================================
// SEEDED OPPORTUNITY TEMPLATES — these get scored dynamically
// ============================================
const OPPORTUNITY_TEMPLATES = [
  {
    title: 'How I stay structured while traveling',
    why: 'Strong fit for current context — travel + remote work + discipline.',
    sourceActivities: ['Remote work', 'Travel / airport'],
    angle: 'Show the system, not the struggle. Morning routine or workspace setup in a new city.',
    format: 'photo + caption',
    tagMatches: ['systems', 'discipline', 'travel'],
  },
  {
    title: 'What this city gets right about energy',
    why: 'City exploration creates fresh perspective content.',
    sourceActivities: ['Coffee walk', 'Rooftop'],
    angle: 'Observation post. What the city teaches about rhythm, pace, or design.',
    format: 'short text post',
    tagMatches: ['perspective', 'city', 'taste'],
  },
  {
    title: 'Wellness without turning boring',
    why: 'Fitness + recovery signals match brand pillars.',
    sourceActivities: ['Gym', 'Recovery / quiet routine'],
    angle: 'Frame wellness as sharpness, not sacrifice. Quick take on what recovery actually looks like.',
    format: 'photo + caption',
    tagMatches: ['wellness', 'discipline', 'fitness'],
  },
  {
    title: 'What training teaches me about work rhythm',
    why: 'Cross-domain insight content. Gym frequency makes this authentic.',
    sourceActivities: ['Gym', 'Remote work'],
    angle: 'Bridge physical training and professional performance. Short and sharp.',
    format: 'short text post',
    tagMatches: ['discipline', 'systems', 'fitness'],
  },
  {
    title: 'The difference between movement and performance',
    why: 'High-insight angle on a common activity.',
    sourceActivities: ['Gym', 'Run'],
    angle: 'Separate doing something from doing it well. Applies to work and training.',
    format: 'carousel',
    tagMatches: ['discipline', 'perspective', 'fitness'],
  },
  {
    title: 'City textures and taste',
    why: 'High visual potential from restaurants and coffee walks.',
    sourceActivities: ['Coffee walk', 'Restaurant'],
    angle: 'Visual story. Details that signal taste — not food tourism, but noticing.',
    format: 'photo + caption',
    tagMatches: ['taste', 'city', 'lifestyle'],
  },
  {
    title: 'What I noticed this week',
    why: 'Evergreen reflective format. Works when you have observations but no thesis.',
    sourceActivities: ['Coffee walk', 'Social dinner', 'Rooftop'],
    angle: 'Short list of observations. Low effort, high brand fit if done with taste.',
    format: 'short text post',
    tagMatches: ['perspective', 'taste', 'observant'],
  },
  {
    title: 'Evening light from the rooftop',
    why: 'High visual potential. Strong capture moment.',
    sourceActivities: ['Rooftop'],
    angle: 'Pure visual. Let the image carry the weight. Minimal caption.',
    format: 'capture only',
    tagMatches: ['visual', 'city', 'taste'],
  },
  {
    title: 'Dinner table conversations',
    why: 'Social moments signal lifestyle but risk being generic.',
    sourceActivities: ['Social dinner', 'Restaurant'],
    angle: 'If the moment is genuinely interesting, capture it. Otherwise save for later.',
    format: 'capture only',
    tagMatches: ['social', 'lifestyle'],
  },
  {
    title: 'Airport transition — between places',
    why: 'Travel content is common but can be elevated with perspective.',
    sourceActivities: ['Travel / airport'],
    angle: 'Frame the transition, not the destination. What travel actually feels like.',
    format: 'voiceover',
    tagMatches: ['travel', 'perspective', 'transition'],
  },
];


// ============================================
// STATE
// ============================================
let state = {
  week: { ...DEFAULT_WEEK },
  activities: DEFAULT_ACTIVITIES.map(a => ({ ...a })),
  brand: { ...DEFAULT_BRAND },
  opportunities: [],
  boardOverrides: {}, // { oppIndex: 'post' | 'capture' | 'skip' }
  history: [],
};


// ============================================
// PERSISTENCE
// ============================================

function saveState() {
  const toSave = {
    week: state.week,
    activities: state.activities,
    brand: state.brand,
    boardOverrides: state.boardOverrides,
    history: state.history,
  };
  localStorage.setItem('cdl-state', JSON.stringify(toSave));
}

function loadState() {
  const saved = localStorage.getItem('cdl-state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.week = parsed.week || { ...DEFAULT_WEEK };
      state.activities = parsed.activities || DEFAULT_ACTIVITIES.map(a => ({ ...a }));
      state.brand = parsed.brand || { ...DEFAULT_BRAND };
      state.boardOverrides = parsed.boardOverrides || {};
      state.history = parsed.history || [];
    } catch (e) {
      console.warn('Failed to load saved state, using defaults.');
    }
  }
}

function resetToDefaults() {
  if (!confirm('Reset everything to default seed data? History will be preserved.')) return;
  state.week = { ...DEFAULT_WEEK };
  state.activities = DEFAULT_ACTIVITIES.map(a => ({ ...a }));
  state.brand = { ...DEFAULT_BRAND };
  state.boardOverrides = {};
  saveState();
  renderAll();
}


// ============================================
// SCORING ENGINE
// ============================================

function parseBrandTerms(field) {
  return (state.brand[field] || '').split('\n').map(s => s.trim().toLowerCase()).filter(Boolean);
}

function activityTagSet() {
  const tags = new Set();
  state.activities.forEach(a => {
    (a.tags || '').split(',').forEach(t => {
      const trimmed = t.trim().toLowerCase();
      if (trimmed) tags.add(trimmed);
    });
  });
  return tags;
}

function averageActivityScore(activities, field) {
  const matched = state.activities.filter(a =>
    activities.some(name => a.type.toLowerCase() === name.toLowerCase())
  );
  if (matched.length === 0) return 3;
  return matched.reduce((sum, a) => sum + (a[field] || 3), 0) / matched.length;
}

function scoreOpportunity(template) {
  const pillars = parseBrandTerms('pillars');
  const tone = parseBrandTerms('tone');
  const avoid = parseBrandTerms('avoid');
  const allTags = activityTagSet();
  const matchTags = (template.tagMatches || []).map(t => t.toLowerCase());

  // Brand fit: how many tag matches overlap with brand pillars + tone
  const pillarOverlap = matchTags.filter(t =>
    pillars.some(p => p.includes(t) || t.includes(p))
  ).length;
  const toneOverlap = matchTags.filter(t =>
    tone.some(p => p.includes(t) || t.includes(p))
  ).length;
  const avoidPenalty = matchTags.filter(t =>
    avoid.some(a => a.includes(t) || t.includes(a))
  ).length;
  const brandFitRaw = Math.min(5, (pillarOverlap * 1.5 + toneOverlap * 0.8) - avoidPenalty);
  const brandFit = Math.max(1, Math.round(brandFitRaw));

  // Uniqueness: inversely related to how common the source activities are
  const freqSum = template.sourceActivities.reduce((sum, name) => {
    const act = state.activities.find(a => a.type.toLowerCase() === name.toLowerCase());
    if (!act) return sum;
    const freq = parseInt(act.frequency) || 1;
    return sum + freq;
  }, 0);
  const uniqueness = Math.max(1, Math.min(5, 6 - Math.round(freqSum / template.sourceActivities.length)));

  // Ease of capture: average of source activities' ease scores
  const easeOfCapture = Math.round(averageActivityScore(template.sourceActivities, 'ease'));

  // Ease of execution: based on format AE level (lower AE = easier)
  const aeLevel = AE_MAP[template.format] || 3;
  const easeOfExecution = Math.max(1, 6 - aeLevel);

  // Week relevance: how many source activities exist in this week + energy alignment
  const presentCount = template.sourceActivities.filter(name =>
    state.activities.some(a => a.type.toLowerCase() === name.toLowerCase())
  ).length;
  const relevanceBase = Math.round((presentCount / template.sourceActivities.length) * 5);
  const energyBonus = state.week.energy === 'high' ? 0.5 : state.week.energy === 'low' ? -0.5 : 0;
  const weekRelevance = Math.max(1, Math.min(5, relevanceBase + energyBonus));

  const scores = { brandFit, uniqueness, easeOfCapture, easeOfExecution, weekRelevance };

  // Weighted total
  const total = (
    scores.brandFit * SCORING_WEIGHTS.brandFit +
    scores.uniqueness * SCORING_WEIGHTS.uniqueness +
    scores.easeOfCapture * SCORING_WEIGHTS.easeOfCapture +
    scores.easeOfExecution * SCORING_WEIGHTS.easeOfExecution +
    scores.weekRelevance * SCORING_WEIGHTS.weekRelevance
  );

  return { ...scores, total: Math.round(total * 100) / 100, aeLevel };
}

function generateOpportunities() {
  state.opportunities = OPPORTUNITY_TEMPLATES.map((template, idx) => {
    const scores = scoreOpportunity(template);
    return { ...template, ...scores, id: idx };
  }).sort((a, b) => b.total - a.total);
}

function getBucket(opp) {
  if (state.boardOverrides[opp.id] !== undefined) {
    return state.boardOverrides[opp.id];
  }
  if (opp.total >= 3.5) return 'post';
  if (opp.total >= 2.5) return 'capture';
  return 'skip';
}

function getScoreClass(val) {
  if (val >= 4) return 'high';
  if (val >= 2.5) return 'medium';
  return 'low';
}


// ============================================
// EXECUTIVE SUMMARY GENERATION
// ============================================

function generateSummary() {
  const postOpps = state.opportunities.filter(o => getBucket(o) === 'post');
  const captureOpps = state.opportunities.filter(o => getBucket(o) === 'capture');

  const formats = {};
  postOpps.forEach(o => {
    formats[o.format] = (formats[o.format] || 0) + 1;
  });
  const topFormats = Object.entries(formats).sort((a, b) => b[1] - a[1]).map(e => e[0]);

  // Build fast-take lines
  const energyWord = state.week.energy === 'high' ? 'strong' : state.week.energy === 'low' ? 'quieter' : 'balanced';

  const tagCounts = {};
  postOpps.forEach(o => {
    (o.tagMatches || []).forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  const topThemes = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

  const fastTake = [
    `This week is ${energyWord} for ${topThemes.slice(0, 2).join(' and ')} content.`,
    `You have enough signal for ${postOpps.length} strong post${postOpps.length !== 1 ? 's' : ''} and ${captureOpps.length} capture-only moment${captureOpps.length !== 1 ? 's' : ''}.`,
    topThemes.length > 0 ? `Best angles come from ${topThemes.join(', ')}.` : '',
  ].filter(Boolean);

  return {
    fastTake,
    postCount: postOpps.length,
    captureCount: captureOpps.length,
    topFormats: topFormats.slice(0, 3),
    topCaptureTitles: captureOpps.slice(0, 2).map(o => o.title),
  };
}


// ============================================
// RENDER FUNCTIONS
// ============================================

function renderAll() {
  generateOpportunities();
  renderSummary();
  renderWeekInputs();
  renderActivities();
  renderBrand();
  renderOpportunities();
  renderDecisionBoard();
  renderRecommendations();
  renderHistory();
}

// --- Executive Summary ---
function renderSummary() {
  const summary = generateSummary();
  const el = document.getElementById('executive-summary');

  el.innerHTML = `
    <div class="summary-label">Weekly Decision Summary</div>
    <div class="summary-fast-take">
      ${summary.fastTake.map(line => `<div style="margin-bottom: 6px;">${line}</div>`).join('')}
    </div>
    <div class="summary-metrics">
      <div class="summary-metric">
        <div class="metric-label">Recommended Posts</div>
        <div class="metric-value">${summary.postCount} posts this week</div>
      </div>
      <div class="summary-metric">
        <div class="metric-label">Best Formats</div>
        <div class="metric-value">${summary.topFormats.join(', ') || 'No strong signal'}</div>
      </div>
      <div class="summary-metric">
        <div class="metric-label">Capture Moments</div>
        <div class="metric-value">${summary.captureCount} to save for later</div>
      </div>
      <div class="summary-metric">
        <div class="metric-label">Capture, Don't Force</div>
        <div class="metric-value">${summary.topCaptureTitles.join('; ') || 'Nothing flagged'}</div>
      </div>
    </div>
  `;
}

// --- Week Inputs ---
function renderWeekInputs() {
  document.getElementById('week-label').value = state.week.label;
  document.getElementById('week-city').value = state.week.city;
  document.getElementById('week-notes').value = state.week.notes;
  document.getElementById('week-target').value = state.week.targetPosts;

  // Set energy pills
  document.querySelectorAll('#energy-pills .pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.value === state.week.energy);
  });

  // Set effort pills
  document.querySelectorAll('#effort-pills .pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.value === state.week.effort);
  });
}

function bindWeekInputs() {
  const fields = ['week-label', 'week-city', 'week-notes', 'week-target'];
  const stateKeys = ['label', 'city', 'notes', 'targetPosts'];

  fields.forEach((id, i) => {
    document.getElementById(id).addEventListener('input', (e) => {
      state.week[stateKeys[i]] = id === 'week-target' ? parseInt(e.target.value) || 3 : e.target.value;
      onInputChange();
    });
  });

  document.querySelectorAll('#energy-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      state.week.energy = pill.dataset.value;
      document.querySelectorAll('#energy-pills .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      onInputChange();
    });
  });

  document.querySelectorAll('#effort-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      state.week.effort = pill.dataset.value;
      document.querySelectorAll('#effort-pills .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      onInputChange();
    });
  });
}

// --- Activities ---
function renderActivities() {
  const container = document.getElementById('activity-list');
  container.innerHTML = state.activities.map((a, i) => `
    <div class="activity-row" data-index="${i}">
      <input type="text" value="${a.type}" data-field="type" placeholder="Activity">
      <input type="text" value="${a.frequency}" data-field="frequency" placeholder="Freq" style="text-align:center;">
      <input type="text" value="${a.tags}" data-field="tags" placeholder="Tags (comma-separated)">
      <input type="number" class="rating-input" value="${a.visual}" data-field="visual" min="1" max="5" title="Visual potential">
      <input type="number" class="rating-input" value="${a.insight}" data-field="insight" min="1" max="5" title="Insight potential">
      <input type="number" class="rating-input" value="${a.ease}" data-field="ease" min="1" max="5" title="Ease of capture">
      <button class="btn-remove" onclick="removeActivity(${i})" title="Remove">&times;</button>
    </div>
  `).join('');

  // Bind activity inputs
  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
      const row = e.target.closest('.activity-row');
      const idx = parseInt(row.dataset.index);
      const field = e.target.dataset.field;
      const val = e.target.type === 'number' ? Math.max(1, Math.min(5, parseInt(e.target.value) || 1)) : e.target.value;
      state.activities[idx][field] = val;
      onInputChange();
    });
  });
}

function addActivity() {
  state.activities.push({ type: '', frequency: '1x', tags: '', visual: 3, insight: 3, ease: 3 });
  renderActivities();
  saveState();
}

function removeActivity(index) {
  state.activities.splice(index, 1);
  renderActivities();
  onInputChange();
}

// --- Brand Profile ---
function renderBrand() {
  document.getElementById('brand-pillars').value = state.brand.pillars;
  document.getElementById('brand-tone').value = state.brand.tone;
  document.getElementById('brand-avoid').value = state.brand.avoid;
  document.getElementById('brand-audience').value = state.brand.audience;
  document.getElementById('brand-reputation').value = state.brand.reputation;
}

function bindBrandInputs() {
  const fields = ['brand-pillars', 'brand-tone', 'brand-avoid', 'brand-audience', 'brand-reputation'];
  const stateKeys = ['pillars', 'tone', 'avoid', 'audience', 'reputation'];

  fields.forEach((id, i) => {
    document.getElementById(id).addEventListener('input', (e) => {
      state.brand[stateKeys[i]] = e.target.value;
      onInputChange();
    });
  });
}

// --- Opportunities ---
function renderOpportunities() {
  const container = document.getElementById('opportunity-list');
  container.innerHTML = state.opportunities.map((opp, i) => `
    <div class="opportunity-card">
      <div class="opp-header">
        <div class="opp-title">${opp.title}</div>
        <div class="total-score ${getScoreClass(opp.total)}">${opp.total.toFixed(1)}</div>
      </div>
      <div class="opp-why">${opp.why}</div>
      <div class="opp-meta">
        <span class="tag tag-format">${opp.format}</span>
        <span class="tag tag-ae">AE${opp.aeLevel}</span>
        ${opp.sourceActivities.map(a => `<span class="tag">${a}</span>`).join('')}
      </div>
      <div class="opp-angle">${opp.angle}</div>
      <div class="opp-scores">
        ${renderScoreBar('Brand fit', opp.brandFit)}
        ${renderScoreBar('Uniqueness', opp.uniqueness)}
        ${renderScoreBar('Capture ease', opp.easeOfCapture)}
        ${renderScoreBar('Exec ease', opp.easeOfExecution)}
        ${renderScoreBar('Week fit', opp.weekRelevance)}
      </div>
    </div>
  `).join('');
}

function renderScoreBar(label, value) {
  const pct = (value / 5) * 100;
  const cls = value >= 4 ? 'high' : value >= 3 ? 'medium' : 'low';
  return `
    <div class="score-row">
      <span class="score-label">${label}</span>
      <div class="score-bar-track">
        <div class="score-bar-fill ${cls}" style="width: ${pct}%"></div>
      </div>
      <span class="score-value">${value}</span>
    </div>
  `;
}

// --- Decision Board ---
function renderDecisionBoard() {
  const buckets = { post: [], capture: [], skip: [] };

  state.opportunities.forEach(opp => {
    const bucket = getBucket(opp);
    buckets[bucket].push(opp);
  });

  ['post', 'capture', 'skip'].forEach(bucket => {
    const container = document.getElementById(`board-${bucket}`);
    const countEl = container.closest('.board-column').querySelector('.count');
    countEl.textContent = buckets[bucket].length;

    container.innerHTML = buckets[bucket].map(opp => `
      <div class="board-card" draggable="true" data-id="${opp.id}">
        <div class="board-card-title">${opp.title}</div>
        <div class="board-card-meta">
          <span class="tag tag-format">${opp.format}</span>
          <span class="tag tag-ae">AE${opp.aeLevel}</span>
          <span class="total-score ${getScoreClass(opp.total)}" style="font-size: 0.65rem; padding: 1px 6px;">${opp.total.toFixed(1)}</span>
        </div>
        <div class="board-card-actions">
          ${bucket !== 'post' ? `<button onclick="moveCard(${opp.id}, 'post')">Post</button>` : ''}
          ${bucket !== 'capture' ? `<button onclick="moveCard(${opp.id}, 'capture')">Capture</button>` : ''}
          ${bucket !== 'skip' ? `<button onclick="moveCard(${opp.id}, 'skip')">Skip</button>` : ''}
        </div>
      </div>
    `).join('');
  });

  // Drag and drop
  setupDragAndDrop();
}

function moveCard(oppId, bucket) {
  state.boardOverrides[oppId] = bucket;
  saveState();
  renderDecisionBoard();
  renderSummary();
  renderRecommendations();
}

function setupDragAndDrop() {
  const cards = document.querySelectorAll('.board-card');
  const columns = document.querySelectorAll('.board-column');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', card.dataset.id);
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });

  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.style.background = 'var(--bg-surface-hover)';
    });
    col.addEventListener('dragleave', () => {
      col.style.background = '';
    });
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.style.background = '';
      const oppId = parseInt(e.dataTransfer.getData('text/plain'));
      const bucket = col.classList.contains('post') ? 'post' :
                     col.classList.contains('capture') ? 'capture' : 'skip';
      moveCard(oppId, bucket);
    });
  });
}

// --- Recommendations ---
function renderRecommendations() {
  const postOpps = state.opportunities.filter(o => getBucket(o) === 'post').slice(0, 5);
  const captureOpps = state.opportunities.filter(o => getBucket(o) === 'capture').slice(0, 3);

  const recContainer = document.getElementById('rec-posts');
  recContainer.innerHTML = postOpps.length === 0
    ? '<div class="empty-state">No strong post opportunities this week. Consider adjusting inputs.</div>'
    : postOpps.slice(0, 3).map((opp, i) => `
    <div class="rec-card">
      <div class="rec-rank">#${i + 1} Recommended</div>
      <div class="rec-title">${opp.title}</div>
      <div class="rec-detail">
        ${opp.format} &middot; AE${opp.aeLevel} &middot; Score ${opp.total.toFixed(1)}<br>
        <span style="color: var(--text-tertiary); font-style: italic;">${opp.angle}</span>
      </div>
    </div>
  `).join('');

  const captureContainer = document.getElementById('rec-captures');
  captureContainer.innerHTML = captureOpps.length === 0
    ? '<div class="empty-state">No capture moments flagged.</div>'
    : captureOpps.map(opp => `
    <div class="rec-card">
      <div class="rec-rank">Capture</div>
      <div class="rec-title">${opp.title}</div>
      <div class="rec-detail">Better as a saved moment than a post right now.</div>
    </div>
  `).join('');

  // Content balance
  const balanceContainer = document.getElementById('rec-balance');
  const categoryMap = {};
  postOpps.forEach(opp => {
    const cats = (opp.tagMatches || []).slice(0, 2).join('/');
    categoryMap[cats] = (categoryMap[cats] || 0) + 1;
  });

  balanceContainer.innerHTML = Object.keys(categoryMap).length === 0
    ? '<div class="empty-state">Add inputs to see content balance.</div>'
    : `<div class="content-balance">
      ${Object.entries(categoryMap).map(([cat, count]) => `
        <div class="balance-item">
          <span class="balance-count">${count}</span>
          <span>${cat}</span>
        </div>
      `).join('')}
    </div>`;
}

// --- History ---
function renderHistory() {
  const container = document.getElementById('history-list');
  if (state.history.length === 0) {
    container.innerHTML = '<div class="empty-state">No saved weeks yet. Save this week to start building history.</div>';
    return;
  }

  container.innerHTML = state.history.map((h, i) => `
    <div class="history-card">
      <span class="history-label">${h.label}</span>
      <span class="history-city">${h.city}</span>
      <span class="history-posts">${h.postCount} posts</span>
      <span class="history-opps">${h.topOpps.join(', ')}</span>
      <span class="history-date">${h.date}</span>
    </div>
  `).join('');
}

function saveWeekToHistory() {
  const postOpps = state.opportunities.filter(o => getBucket(o) === 'post');
  const entry = {
    label: state.week.label || 'Untitled Week',
    city: state.week.city || '—',
    postCount: postOpps.length,
    topOpps: postOpps.slice(0, 3).map(o => o.title),
    date: new Date().toISOString().split('T')[0],
  };

  // Check for duplicate by label — update if exists
  const existing = state.history.findIndex(h => h.label === entry.label);
  if (existing >= 0) {
    state.history[existing] = entry;
  } else {
    state.history.unshift(entry);
  }

  // Keep max 20 weeks
  if (state.history.length > 20) state.history.pop();

  saveState();
  renderHistory();
}


// ============================================
// COLLAPSIBLE SECTIONS
// ============================================

function setupCollapsibles() {
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const toggle = header.querySelector('.section-toggle');
      const isCollapsed = content.classList.contains('collapsed');

      if (isCollapsed) {
        content.classList.remove('collapsed');
        content.style.maxHeight = content.scrollHeight + 'px';
        toggle.classList.remove('collapsed');
        // After transition, remove max-height so content can resize dynamically
        setTimeout(() => { content.style.maxHeight = 'none'; }, 260);
      } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        // Force reflow
        content.offsetHeight;
        content.classList.add('collapsed');
        toggle.classList.add('collapsed');
      }
    });
  });
}


// ============================================
// INPUT CHANGE HANDLER — re-scores and re-renders
// ============================================

let debounceTimer = null;
function onInputChange() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    // Clear board overrides when inputs change so auto-sort kicks back in
    state.boardOverrides = {};
    saveState();
    generateOpportunities();
    renderSummary();
    renderOpportunities();
    renderDecisionBoard();
    renderRecommendations();
  }, 300);
}


// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderAll();
  bindWeekInputs();
  bindBrandInputs();
  setupCollapsibles();

  // Wire up buttons
  document.getElementById('btn-add-activity').addEventListener('click', addActivity);
  document.getElementById('btn-save-week').addEventListener('click', saveWeekToHistory);
  document.getElementById('btn-reset').addEventListener('click', resetToDefaults);
});

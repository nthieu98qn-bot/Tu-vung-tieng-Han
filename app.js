const STORAGE_KEY = 'hangulDeck.v1';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const sampleData = {
  activeDeckId: 'deck-topik',
  studyOrder: [],
  studyIndex: 0,
  flipped: false,
  shuffle: false,
  editingCardId: null,
  selectedCards: [],
  learn: { order: [], index: 0, correct: 0, wrong: 0, checked: false },
  review: { order: [], index: 0, known: [], hard: [], showing: false },
  quiz: { order: [], index: 0, correct: 0, answered: 0, selected: null, checked: false },
  decks: [
    {
      id: 'deck-topik',
      name: 'TOPIK tiếng Hàn cơ bản',
      createdAt: new Date().toISOString(),
      cards: [
        { id: crypto.randomUUID(), korean: '노력하다', vietnamese: 'nỗ lực, cố gắng', starred: false, createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), korean: '졸업하다', vietnamese: 'tốt nghiệp', starred: false, createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), korean: '기계공학', vietnamese: 'ngành kỹ thuật cơ khí', starred: false, createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), korean: '지원하다', vietnamese: 'ứng tuyển, hỗ trợ', starred: false, createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), korean: '경험', vietnamese: 'kinh nghiệm, trải nghiệm', starred: false, createdAt: new Date().toISOString() }
      ]
    }
  ]
};

let state = loadState();
let autoTimer = null;
let toastTimer = null;
let voices = [];

const els = {
  deckList: $('#deckList'),
  activeDeckName: $('#activeDeckName'),
  totalDecks: $('#totalDecks'),
  totalCards: $('#totalCards'),
  searchInput: $('#searchInput'),
  toast: $('#toast'),

  cardCounter: $('#cardCounter'),
  cardMeta: $('#cardMeta'),
  progressFill: $('#progressFill'),
  flashcard: $('#flashcard'),
  frontKorean: $('#frontKorean'),
  backMeaning: $('#backMeaning'),
  speedSelect: $('#speedSelect'),
  autoSpeakMode: $('#autoSpeakMode'),
  autoPlayBtn: $('#autoPlayBtn'),
  shuffleToggle: $('#shuffleToggle'),

  learnCounter: $('#learnCounter'),
  learnKorean: $('#learnKorean'),
  learnAnswerInput: $('#learnAnswerInput'),
  learnFeedback: $('#learnFeedback'),
  learnCorrect: $('#learnCorrect'),
  learnWrong: $('#learnWrong'),

  reviewCounter: $('#reviewCounter'),
  reviewKorean: $('#reviewKorean'),
  reviewMeaning: $('#reviewMeaning'),
  reviewKnownCount: $('#reviewKnownCount'),
  reviewHardCount: $('#reviewHardCount'),
  hardList: $('#hardList'),

  quizScore: $('#quizScore'),
  quizKorean: $('#quizKorean'),
  quizOptions: $('#quizOptions'),
  quizFeedback: $('#quizFeedback'),
  quizCorrect: $('#quizCorrect'),
  quizAnswered: $('#quizAnswered'),

  cardsTable: $('#cardsTable'),
  libraryTitle: $('#libraryTitle'),
  form: $('#vocabForm'),
  formTitle: $('#formTitle'),
  koreanInput: $('#koreanInput'),
  vietnameseInput: $('#vietnameseInput'),
  saveCardBtn: $('#saveCardBtn'),
  aiSuggestBtn: $('#aiSuggestBtn'),
  previewKorean: $('#previewKorean'),
  previewMeaning: $('#previewMeaning'),
  aiStatus: $('#aiStatus'),
  importResult: $('#importResult'),
  fileInput: $('#fileInput'),
  uploadZone: $('#uploadZone')
};

function normalizeCard(card) {
  return {
    id: card.id || crypto.randomUUID(),
    korean: String(card.korean || card.Korean || card['Tiếng Hàn'] || card['한국어'] || '').trim(),
    vietnamese: String(card.vietnamese || card.Vietnamese || card['Nghĩa'] || card['Nghĩa tiếng Việt'] || card['베트남어'] || '').trim(),
    starred: Boolean(card.starred),
    createdAt: card.createdAt || new Date().toISOString(),
    updatedAt: card.updatedAt
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.decks?.length) {
      const decks = saved.decks.map(deck => ({
        ...deck,
        cards: Array.isArray(deck.cards)
          ? deck.cards.map(normalizeCard).filter(card => card.korean || card.vietnamese)
          : []
      }));
      return {
        ...structuredClone(sampleData),
        ...saved,
        decks,
        learn: { ...structuredClone(sampleData.learn), ...(saved.learn || {}) },
        review: { ...structuredClone(sampleData.review), ...(saved.review || {}) },
        quiz: { ...structuredClone(sampleData.quiz), ...(saved.quiz || {}) },
        selectedCards: [],
        editingCardId: null,
        flipped: false
      };
    }
  } catch (error) {
    console.warn('Cannot parse saved state', error);
  }
  return structuredClone(sampleData);
}

function saveState() {
  const copy = {
    ...state,
    editingCardId: null,
    selectedCards: [],
    flipped: false
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
}

function activeDeck() {
  return state.decks.find(deck => deck.id === state.activeDeckId) || state.decks[0];
}

function activeCards() {
  const deck = activeDeck();
  const query = els.searchInput.value.trim().toLowerCase();
  if (!query) return deck.cards;
  return deck.cards.filter(card => [card.korean, card.vietnamese]
    .some(value => String(value || '').toLowerCase().includes(query)));
}

function activeCardIds() {
  return activeCards().map(card => card.id);
}

function getCardById(id) {
  return activeDeck().cards.find(card => card.id === id) || null;
}

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add('show');
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
}

function setTab(name) {
  $$('.tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === name));
  $$('.tab-panel').forEach(panel => panel.classList.remove('active'));
  $(`#${name}Tab`).classList.add('active');
  if (name === 'learn') renderLearn();
  if (name === 'review') renderReview();
  if (name === 'quiz') renderQuiz();
}

function resetModes() {
  state.studyOrder = [];
  state.studyIndex = 0;
  state.flipped = false;
  state.learn = structuredClone(sampleData.learn);
  state.review = structuredClone(sampleData.review);
  state.quiz = structuredClone(sampleData.quiz);
}

function renderAll() {
  const deck = activeDeck();
  if (!deck) return;

  els.activeDeckName.textContent = deck.name;
  els.libraryTitle.textContent = `${deck.name} · ${deck.cards.length} từ`;
  els.totalDecks.textContent = state.decks.length;
  els.totalCards.textContent = state.decks.reduce((sum, item) => sum + item.cards.length, 0);
  els.shuffleToggle.checked = state.shuffle;

  renderDecks();
  renderFlashcard();
  renderLearn();
  renderReview();
  renderQuiz();
  renderCardsTable();
  renderPreview();
}

function renderDecks() {
  els.deckList.innerHTML = state.decks.map(deck => `
    <button class="deck-item ${deck.id === state.activeDeckId ? 'active' : ''}" data-deck-id="${deck.id}">
      <span>
        <strong>${escapeHtml(deck.name)}</strong>
        <small>${deck.cards.length} từ vựng</small>
      </span>
      <span>›</span>
    </button>
  `).join('');

  $$('.deck-item').forEach(item => {
    item.addEventListener('click', () => {
      state.activeDeckId = item.dataset.deckId;
      resetModes();
      state.selectedCards = [];
      stopAutoPlay(false);
      saveState();
      renderAll();
    });
  });
}

function ensureStudyOrder() {
  const ids = activeCardIds();
  const validExisting = state.studyOrder.filter(id => ids.includes(id));
  if (validExisting.length !== ids.length || ids.some(id => !validExisting.includes(id))) {
    state.studyOrder = state.shuffle ? shuffleArray(ids) : ids;
    state.studyIndex = Math.min(state.studyIndex, Math.max(0, state.studyOrder.length - 1));
  }
}

function currentCard() {
  ensureStudyOrder();
  const id = state.studyOrder[state.studyIndex];
  return getCardById(id);
}

function renderFlashcard() {
  ensureStudyOrder();
  const card = currentCard();
  const total = state.studyOrder.length;
  const index = total ? state.studyIndex + 1 : 0;

  els.flashcard.classList.toggle('flipped', state.flipped);
  els.cardCounter.textContent = `${index} / ${total}`;
  els.progressFill.style.width = total ? `${(index / total) * 100}%` : '0%';
  els.cardMeta.textContent = total ? 'Nhấn vào thẻ để lật' : 'Hãy thêm từ mới hoặc import Excel';

  if (!card) {
    els.frontKorean.textContent = '빈 카드';
    els.backMeaning.textContent = 'Hãy thêm từ mới để bắt đầu học.';
    return;
  }

  els.frontKorean.textContent = card.korean;
  els.backMeaning.textContent = card.vietnamese || 'Chưa có nghĩa';
}

function nextCard() {
  const total = state.studyOrder.length;
  if (!total) return;
  state.studyIndex = (state.studyIndex + 1) % total;
  state.flipped = false;
  saveState();
  renderFlashcard();
  autoSpeakCurrent();
}

function prevCard() {
  const total = state.studyOrder.length;
  if (!total) return;
  state.studyIndex = (state.studyIndex - 1 + total) % total;
  state.flipped = false;
  saveState();
  renderFlashcard();
}

function flipCard() {
  const card = currentCard();
  if (!card) return;
  state.flipped = !state.flipped;
  saveState();
  renderFlashcard();
}

function resetProgress() {
  state.studyIndex = 0;
  state.studyOrder = [];
  state.flipped = false;
  saveState();
  renderFlashcard();
  toast('Đã đưa flashcard về từ đầu.');
}

function ensureLearnOrder() {
  const ids = activeCardIds();
  const valid = state.learn.order.filter(id => ids.includes(id));
  if (valid.length !== ids.length || ids.some(id => !valid.includes(id))) {
    state.learn.order = state.shuffle ? shuffleArray(ids) : ids;
    state.learn.index = Math.min(state.learn.index || 0, Math.max(0, state.learn.order.length - 1));
    state.learn.checked = false;
  }
}

function currentLearnCard() {
  ensureLearnOrder();
  return getCardById(state.learn.order[state.learn.index]);
}

function normalizeAnswer(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;:!?()[\]{}"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function answerLooksCorrect(userAnswer, correctAnswer) {
  const user = normalizeAnswer(userAnswer);
  const correct = normalizeAnswer(correctAnswer);
  if (!user || !correct) return false;
  if (user === correct || correct.includes(user) || user.includes(correct)) return true;

  const userTokens = new Set(user.split(' ').filter(token => token.length > 1));
  const correctTokens = correct.split(' ').filter(token => token.length > 1);
  if (!userTokens.size || !correctTokens.length) return false;
  const matched = correctTokens.filter(token => userTokens.has(token)).length;
  return matched / correctTokens.length >= 0.6;
}

function setFeedback(element, type, html) {
  element.className = `feedback ${type}`;
  element.innerHTML = html;
}

function renderLearn() {
  ensureLearnOrder();
  const card = currentLearnCard();
  const total = state.learn.order.length;
  const index = total ? state.learn.index + 1 : 0;
  els.learnCounter.textContent = `${index} / ${total}`;
  els.learnCorrect.textContent = state.learn.correct || 0;
  els.learnWrong.textContent = state.learn.wrong || 0;

  if (!card) {
    els.learnKorean.textContent = '빈 카드';
    els.learnAnswerInput.value = '';
    setFeedback(els.learnFeedback, 'neutral', 'Hãy thêm từ mới hoặc import Excel để học.');
    return;
  }

  els.learnKorean.textContent = card.korean;
  if (!state.learn.checked) els.learnFeedback.classList.add('hidden');
}

function checkLearnAnswer() {
  const card = currentLearnCard();
  if (!card) return;
  if (state.learn.checked) {
    nextLearnQuestion();
    return;
  }

  const userAnswer = els.learnAnswerInput.value.trim();
  const correct = answerLooksCorrect(userAnswer, card.vietnamese);
  state.learn.checked = true;

  if (correct) {
    state.learn.correct += 1;
    setFeedback(els.learnFeedback, 'good', `Đúng rồi ✅<br><strong>${escapeHtml(card.korean)}</strong> = ${escapeHtml(card.vietnamese)}`);
    markKnown(card.id);
  } else {
    state.learn.wrong += 1;
    setFeedback(els.learnFeedback, 'bad', `Chưa đúng ❌<br>Đáp án: <strong>${escapeHtml(card.vietnamese)}</strong>`);
    markHard(card.id);
  }
  saveState();
  renderLearnStatsOnly();
}

function revealLearnAnswer() {
  const card = currentLearnCard();
  if (!card) return;
  if (!state.learn.checked) state.learn.wrong += 1;
  state.learn.checked = true;
  markHard(card.id);
  setFeedback(els.learnFeedback, 'neutral', `Đáp án: <strong>${escapeHtml(card.vietnamese)}</strong>`);
  saveState();
  renderLearnStatsOnly();
}

function renderLearnStatsOnly() {
  els.learnCorrect.textContent = state.learn.correct || 0;
  els.learnWrong.textContent = state.learn.wrong || 0;
  renderReview();
}

function nextLearnQuestion() {
  const total = state.learn.order.length;
  if (!total) return;
  state.learn.index = (state.learn.index + 1) % total;
  state.learn.checked = false;
  els.learnAnswerInput.value = '';
  els.learnFeedback.classList.add('hidden');
  saveState();
  renderLearn();
  els.learnAnswerInput.focus();
}

function resetLearn() {
  state.learn = structuredClone(sampleData.learn);
  els.learnAnswerInput.value = '';
  saveState();
  renderLearn();
  toast('Đã học lại từ đầu.');
}

function ensureReviewOrder() {
  const ids = activeCardIds();
  const valid = state.review.order.filter(id => ids.includes(id));
  if (valid.length !== ids.length || ids.some(id => !valid.includes(id))) {
    const hardFirst = state.review.hard.filter(id => ids.includes(id));
    const rest = ids.filter(id => !hardFirst.includes(id));
    state.review.order = [...hardFirst, ...rest];
    state.review.index = Math.min(state.review.index || 0, Math.max(0, state.review.order.length - 1));
    state.review.showing = false;
  }
  state.review.known = state.review.known.filter(id => ids.includes(id));
  state.review.hard = state.review.hard.filter(id => ids.includes(id));
}

function currentReviewCard() {
  ensureReviewOrder();
  return getCardById(state.review.order[state.review.index]);
}

function markKnown(id) {
  if (!id) return;
  state.review.known = Array.from(new Set([...(state.review.known || []), id]));
  state.review.hard = (state.review.hard || []).filter(item => item !== id);
}

function markHard(id) {
  if (!id) return;
  state.review.hard = Array.from(new Set([...(state.review.hard || []), id]));
  state.review.known = (state.review.known || []).filter(item => item !== id);
}

function renderReview() {
  ensureReviewOrder();
  const card = currentReviewCard();
  const total = state.review.order.length;
  const index = total ? state.review.index + 1 : 0;

  els.reviewCounter.textContent = `${index} / ${total}`;
  els.reviewKnownCount.textContent = state.review.known.length;
  els.reviewHardCount.textContent = state.review.hard.length;

  if (!card) {
    els.reviewKorean.textContent = '빈 카드';
    els.reviewMeaning.textContent = 'Hãy thêm từ mới để ôn tập.';
    els.reviewMeaning.classList.remove('hidden');
  } else {
    els.reviewKorean.textContent = card.korean;
    els.reviewMeaning.textContent = card.vietnamese || 'Chưa có nghĩa';
    els.reviewMeaning.classList.toggle('hidden', !state.review.showing);
  }

  const hardCards = state.review.hard.map(getCardById).filter(Boolean);
  els.hardList.innerHTML = hardCards.length
    ? hardCards.map(item => `<div class="mini-list-item"><strong>${escapeHtml(item.korean)}</strong><small>${escapeHtml(item.vietnamese)}</small></div>`).join('')
    : '<div class="empty-state"><strong>Chưa có từ khó</strong><span>Bấm “Chưa nhớ” để thêm từ vào đây.</span></div>';
}

function showReviewMeaning() {
  state.review.showing = true;
  saveState();
  renderReview();
}

function nextReviewCard() {
  const total = state.review.order.length;
  if (!total) return;
  state.review.index = (state.review.index + 1) % total;
  state.review.showing = false;
  saveState();
  renderReview();
}

function reviewKnown() {
  const card = currentReviewCard();
  if (!card) return;
  markKnown(card.id);
  nextReviewCard();
  renderReview();
}

function reviewHard() {
  const card = currentReviewCard();
  if (!card) return;
  markHard(card.id);
  nextReviewCard();
  renderReview();
}

function resetReview() {
  state.review = structuredClone(sampleData.review);
  saveState();
  renderReview();
  toast('Đã reset phần ôn tập.');
}

function ensureQuizOrder() {
  const ids = activeCardIds();
  const valid = state.quiz.order.filter(id => ids.includes(id));
  if (valid.length !== ids.length || ids.some(id => !valid.includes(id))) {
    state.quiz.order = shuffleArray(ids);
    state.quiz.index = Math.min(state.quiz.index || 0, Math.max(0, state.quiz.order.length - 1));
    state.quiz.selected = null;
    state.quiz.checked = false;
  }
}

function currentQuizCard() {
  ensureQuizOrder();
  return getCardById(state.quiz.order[state.quiz.index]);
}

function quizOptionsFor(card) {
  if (!card) return [];
  const cards = activeCards();
  const wrong = shuffleArray(cards.filter(item => item.id !== card.id && item.vietnamese).map(item => item.vietnamese));
  return shuffleArray([card.vietnamese, ...wrong.slice(0, 3)]).filter(Boolean);
}

function renderQuiz() {
  ensureQuizOrder();
  const card = currentQuizCard();
  const total = state.quiz.order.length;
  els.quizScore.textContent = `${state.quiz.correct || 0} / ${state.quiz.answered || 0}`;
  els.quizCorrect.textContent = state.quiz.correct || 0;
  els.quizAnswered.textContent = state.quiz.answered || 0;

  if (!card) {
    els.quizKorean.textContent = '빈 카드';
    els.quizOptions.innerHTML = '<div class="empty-state"><strong>Chưa có từ để làm trắc nghiệm</strong><span>Hãy thêm từ hoặc import Excel.</span></div>';
    els.quizFeedback.classList.add('hidden');
    return;
  }

  els.quizKorean.textContent = card.korean;
  const options = quizOptionsFor(card);
  if (total < 2) {
    els.quizOptions.innerHTML = '<div class="empty-state"><strong>Cần ít nhất 2 từ</strong><span>Thêm thêm từ để có đáp án nhiễu.</span></div>';
  } else {
    els.quizOptions.innerHTML = options.map(option => {
      let className = 'quiz-option';
      if (state.quiz.checked && option === card.vietnamese) className += ' correct';
      if (state.quiz.checked && option === state.quiz.selected && option !== card.vietnamese) className += ' wrong';
      return `<button class="${className}" data-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`;
    }).join('');
  }

  $$('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => selectQuizAnswer(btn.dataset.answer));
  });

  if (!state.quiz.checked) els.quizFeedback.classList.add('hidden');
}

function selectQuizAnswer(answer) {
  const card = currentQuizCard();
  if (!card || state.quiz.checked) return;
  state.quiz.selected = answer;
  state.quiz.checked = true;
  state.quiz.answered += 1;

  if (answer === card.vietnamese) {
    state.quiz.correct += 1;
    markKnown(card.id);
    setFeedback(els.quizFeedback, 'good', 'Chính xác ✅');
  } else {
    markHard(card.id);
    setFeedback(els.quizFeedback, 'bad', `Sai rồi ❌<br>Đáp án đúng: <strong>${escapeHtml(card.vietnamese)}</strong>`);
  }
  saveState();
  renderQuiz();
  renderReview();
}

function nextQuizQuestion() {
  const total = state.quiz.order.length;
  if (!total) return;
  state.quiz.index = (state.quiz.index + 1) % total;
  state.quiz.selected = null;
  state.quiz.checked = false;
  saveState();
  renderQuiz();
}

function resetQuiz() {
  state.quiz = structuredClone(sampleData.quiz);
  saveState();
  renderQuiz();
  toast('Đã làm lại trắc nghiệm.');
}

function renderCardsTable() {
  const cards = activeCards();
  if (!cards.length) {
    els.cardsTable.innerHTML = `
      <div class="empty-state">
        <strong>Chưa có từ phù hợp</strong>
        <span>Thêm từ mới, import Excel hoặc xóa ô tìm kiếm.</span>
      </div>
    `;
    return;
  }

  els.cardsTable.innerHTML = `
    <div class="card-row header">
      <div><input type="checkbox" id="selectAllCards" ${cards.every(card => state.selectedCards.includes(card.id)) ? 'checked' : ''}></div>
      <div>Tiếng Hàn</div>
      <div>Nghĩa tiếng Việt</div>
      <div></div>
    </div>
    ${cards.map(card => `
      <div class="card-row" data-card-id="${card.id}">
        <div><input class="card-check" type="checkbox" ${state.selectedCards.includes(card.id) ? 'checked' : ''}></div>
        <div class="ko-cell">${escapeHtml(card.korean)}</div>
        <div class="vi-cell">${escapeHtml(card.vietnamese)}</div>
        <div class="row-actions">
          <button class="icon-btn star-row ${card.starred ? 'starred' : ''}" title="Đánh dấu">★</button>
          <button class="icon-btn speak-row" title="Đọc">🔊</button>
          <button class="icon-btn edit-row" title="Sửa">✎</button>
          <button class="icon-btn danger delete-row" title="Xóa">×</button>
        </div>
      </div>
    `).join('')}
  `;

  const selectAll = $('#selectAllCards');
  if (selectAll) {
    selectAll.addEventListener('change', () => {
      const visibleIds = cards.map(card => card.id);
      state.selectedCards = selectAll.checked
        ? Array.from(new Set([...state.selectedCards, ...visibleIds]))
        : state.selectedCards.filter(id => !visibleIds.includes(id));
      renderCardsTable();
    });
  }

  $$('.card-row[data-card-id]').forEach(row => {
    const cardId = row.dataset.cardId;
    const card = getCardById(cardId);
    row.querySelector('.card-check').addEventListener('change', (event) => {
      if (event.target.checked) state.selectedCards = Array.from(new Set([...state.selectedCards, cardId]));
      else state.selectedCards = state.selectedCards.filter(id => id !== cardId);
    });
    row.querySelector('.star-row').addEventListener('click', () => toggleStar(cardId));
    row.querySelector('.speak-row').addEventListener('click', () => speakBoth(card));
    row.querySelector('.edit-row').addEventListener('click', () => editCard(cardId));
    row.querySelector('.delete-row').addEventListener('click', () => deleteCard(cardId));
  });
}

function renderPreview() {
  els.previewKorean.textContent = els.koreanInput.value.trim() || '한국어';
  els.previewMeaning.textContent = els.vietnameseInput.value.trim() || 'Nghĩa tiếng Việt sẽ hiện ở đây.';
}

function clearForm() {
  state.editingCardId = null;
  els.formTitle.textContent = 'Thêm từ mới';
  els.saveCardBtn.textContent = 'Lưu từ vựng';
  els.form.reset();
  renderPreview();
}

function readForm() {
  return {
    korean: els.koreanInput.value.trim(),
    vietnamese: els.vietnameseInput.value.trim()
  };
}

function fillForm(card) {
  els.koreanInput.value = card.korean || '';
  els.vietnameseInput.value = card.vietnamese || '';
  renderPreview();
}

function saveCard(event) {
  event.preventDefault();
  const formData = readForm();
  if (!formData.korean || !formData.vietnamese) {
    toast('Cần nhập tiếng Hàn và nghĩa tiếng Việt.');
    return;
  }

  const deck = activeDeck();
  if (state.editingCardId) {
    const card = deck.cards.find(item => item.id === state.editingCardId);
    Object.assign(card, formData, { updatedAt: new Date().toISOString() });
    toast('Đã cập nhật từ vựng.');
  } else {
    deck.cards.unshift({
      id: crypto.randomUUID(),
      ...formData,
      starred: false,
      createdAt: new Date().toISOString()
    });
    resetModes();
    toast('Đã thêm từ mới.');
  }

  saveState();
  clearForm();
  renderAll();
}

function editCard(cardId) {
  const card = getCardById(cardId);
  if (!card) return;
  state.editingCardId = cardId;
  els.formTitle.textContent = 'Sửa từ vựng';
  els.saveCardBtn.textContent = 'Cập nhật từ';
  fillForm(card);
  setTab('add');
  els.koreanInput.focus();
}

function deleteCard(cardId) {
  const card = getCardById(cardId);
  if (!card) return;
  const ok = confirm(`Xóa từ "${card.korean}"?`);
  if (!ok) return;
  activeDeck().cards = activeDeck().cards.filter(item => item.id !== cardId);
  state.selectedCards = state.selectedCards.filter(id => id !== cardId);
  resetModes();
  saveState();
  renderAll();
  toast('Đã xóa từ vựng.');
}

function toggleStar(cardId) {
  const card = getCardById(cardId);
  if (!card) return;
  card.starred = !card.starred;
  if (card.starred) markHard(cardId);
  saveState();
  renderAll();
}

function createDeck() {
  const name = prompt('Nhập tên bộ từ mới:');
  if (!name?.trim()) return;
  const deck = { id: crypto.randomUUID(), name: name.trim(), createdAt: new Date().toISOString(), cards: [] };
  state.decks.unshift(deck);
  state.activeDeckId = deck.id;
  resetModes();
  saveState();
  renderAll();
  toast('Đã tạo bộ từ mới.');
}

function renameDeck() {
  const deck = activeDeck();
  if (!deck) return;
  const name = prompt('Đổi tên bộ từ:', deck.name);
  if (!name?.trim()) return;
  deck.name = name.trim();
  saveState();
  renderAll();
  toast('Đã đổi tên bộ từ.');
}

function deleteDeck() {
  const deck = activeDeck();
  if (!deck) return;
  if (state.decks.length === 1) {
    toast('Cần giữ ít nhất 1 bộ từ.');
    return;
  }
  const ok = confirm(`Xóa bộ "${deck.name}" và toàn bộ từ vựng bên trong?`);
  if (!ok) return;
  state.decks = state.decks.filter(item => item.id !== deck.id);
  state.activeDeckId = state.decks[0].id;
  state.selectedCards = [];
  resetModes();
  stopAutoPlay(false);
  saveState();
  renderAll();
  toast('Đã xóa bộ từ.');
}

function sortAz() {
  activeDeck().cards.sort((a, b) => a.korean.localeCompare(b.korean, 'ko'));
  resetModes();
  saveState();
  renderAll();
  toast('Đã sắp xếp A-Z.');
}

function deleteSelected() {
  if (!state.selectedCards.length) {
    toast('Chưa chọn từ nào.');
    return;
  }
  const ok = confirm(`Xóa ${state.selectedCards.length} từ đã chọn?`);
  if (!ok) return;
  activeDeck().cards = activeDeck().cards.filter(card => !state.selectedCards.includes(card.id));
  state.selectedCards = [];
  resetModes();
  saveState();
  renderAll();
  toast('Đã xóa các từ đã chọn.');
}

function loadVoices() {
  voices = window.speechSynthesis?.getVoices?.() || [];
}

function bestVoice(langPrefix) {
  return voices.find(voice => voice.lang?.toLowerCase().startsWith(langPrefix.toLowerCase())) || null;
}

function speak(text, lang) {
  if (!text || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  const voice = bestVoice(lang);
  if (voice) utterance.voice = voice;
  utterance.rate = lang === 'ko-KR' ? 0.9 : 1;
  window.speechSynthesis.speak(utterance);
}

function speakKorean(text) { speak(text, 'ko-KR'); }
function speakVietnamese(text) { speak(text, 'vi-VN'); }

function speakBoth(card = currentCard()) {
  if (!card) return;
  speakKorean(card.korean);
  setTimeout(() => speakVietnamese(card.vietnamese), 1200);
}

function autoSpeakCurrent() {
  const mode = els.autoSpeakMode.value;
  if (mode === 'ko') speakKorean(currentCard()?.korean);
  if (mode === 'both') speakBoth();
}

function startAutoPlay() {
  if (!currentCard()) {
    toast('Chưa có từ để tự chạy.');
    return;
  }
  stopAutoPlay(false);
  els.autoPlayBtn.dataset.playing = 'true';
  els.autoPlayBtn.textContent = '⏸ Dừng tự chạy';
  autoSpeakCurrent();
  const delay = Number(els.speedSelect.value || 5) * 1000;
  autoTimer = setInterval(() => {
    if (!state.flipped) {
      state.flipped = true;
      saveState();
      renderFlashcard();
      if (els.autoSpeakMode.value === 'both') setTimeout(() => speakVietnamese(currentCard()?.vietnamese), 300);
    } else {
      nextCard();
    }
  }, delay);
}

function stopAutoPlay(showToast = true) {
  clearInterval(autoTimer);
  autoTimer = null;
  if (els.autoPlayBtn) {
    els.autoPlayBtn.dataset.playing = 'false';
    els.autoPlayBtn.textContent = '▶ Bắt đầu tự chạy';
  }
  if (showToast) toast('Đã dừng tự chạy.');
}

async function suggestWithAI() {
  const word = els.koreanInput.value.trim();
  if (!word) {
    toast('Nhập từ tiếng Hàn trước.');
    els.koreanInput.focus();
    return;
  }

  els.aiSuggestBtn.disabled = true;
  els.aiStatus.textContent = 'Đang hỏi AI...';

  try {
    const response = await fetch('/api/suggest-meaning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'AI không trả lời được.');

    els.koreanInput.value = data.korean || word;
    els.vietnameseInput.value = data.vietnamese || '';
    renderPreview();
    els.aiStatus.textContent = 'Đã gợi ý nghĩa bằng AI.';
    toast('Đã điền nghĩa AI.');
  } catch (error) {
    els.aiStatus.textContent = 'Không dùng được AI trên GitHub Pages hoặc chưa cấu hình server.';
    toast(error.message || 'Không gọi được AI.');
  } finally {
    els.aiSuggestBtn.disabled = false;
  }
}

function rowToCard(row, headers = null, trim = true) {
  const clean = value => trim ? String(value ?? '').trim() : String(value ?? '');
  let korean = '';
  let vietnamese = '';

  if (headers) {
    const object = {};
    headers.forEach((header, index) => {
      object[String(header || '').trim().toLowerCase()] = row[index];
    });
    korean = clean(object.korean || object['tiếng hàn'] || object['tieng han'] || object['한국어'] || object.han || row[0]);
    vietnamese = clean(object.vietnamese || object['nghĩa'] || object['nghia'] || object['nghĩa tiếng việt'] || object['nghia tieng viet'] || object['베트남어'] || object.vi || row[1]);
  } else {
    korean = clean(row[0]);
    vietnamese = clean(row[1]);
  }

  if (!korean || !vietnamese) return null;
  return { id: crypto.randomUUID(), korean, vietnamese, starred: false, createdAt: new Date().toISOString() };
}

function rowsToCards(rows) {
  if (!rows?.length) return [];
  const autoTrim = $('#autoTrimToggle').checked;
  const firstRow = rows[0].map(value => String(value || '').trim().toLowerCase());
  const hasHeader = firstRow.some(value => ['korean', 'vietnamese', 'tiếng hàn', 'tieng han', 'nghĩa', 'nghia'].includes(value));
  const headers = hasHeader ? rows[0] : null;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  return dataRows.map(row => rowToCard(row, headers, autoTrim)).filter(Boolean);
}

async function importFile(file) {
  if (!file) return;
  try {
    let rows = [];
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'csv') {
      rows = parseCsv(await file.text());
    } else {
      if (!window.XLSX) throw new Error('Không tải được thư viện đọc Excel. Hãy kiểm tra mạng.');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    }

    let cards = rowsToCards(rows);
    if (!cards.length) throw new Error('Không tìm thấy dữ liệu. File cần có 2 cột: Korean, Vietnamese.');

    const deck = activeDeck();
    const beforeCount = cards.length;
    if ($('#skipDuplicateToggle').checked) {
      const existing = new Set(deck.cards.map(card => card.korean.toLowerCase()));
      cards = cards.filter(card => !existing.has(card.korean.toLowerCase()));
    }

    deck.cards.unshift(...cards);
    resetModes();
    saveState();
    renderAll();
    showImportResult(`Đã import ${cards.length} từ vào bộ "${deck.name}".${beforeCount !== cards.length ? ` Bỏ qua ${beforeCount - cards.length} từ trùng.` : ''}`);
    toast(`Đã import ${cards.length} từ.`);
    els.fileInput.value = '';
  } catch (error) {
    showImportResult(error.message, true);
    toast(error.message);
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function showImportResult(message, isError = false) {
  els.importResult.textContent = message;
  els.importResult.classList.remove('hidden', 'error');
  if (isError) els.importResult.classList.add('error');
}

function download(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportJson() {
  download(`hangul-deck-backup-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(state, null, 2), 'application/json;charset=utf-8');
  toast('Đã xuất JSON.');
}

function csvEscape(value) {
  return `"${String(value || '').replaceAll('"', '""')}"`;
}

function exportCsv() {
  const deck = activeDeck();
  const header = ['Korean', 'Vietnamese'];
  const rows = deck.cards.map(card => [card.korean, card.vietnamese]);
  const csv = [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');
  download(`${deck.name.replace(/[^\p{L}\p{N}]+/gu, '-')}.csv`, '\ufeff' + csv, 'text/csv;charset=utf-8');
  toast('Đã xuất CSV.');
}

async function copyTemplate() {
  const template = 'Korean,Vietnamese\n노력하다,nỗ lực; cố gắng\n졸업하다,tốt nghiệp';
  await navigator.clipboard.writeText(template);
  toast('Đã copy mẫu cột Excel/CSV.');
}

function resetApp() {
  const ok = confirm('Xóa toàn bộ dữ liệu app và quay về dữ liệu mẫu?');
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(sampleData);
  stopAutoPlay(false);
  saveState();
  renderAll();
  toast('Đã reset app.');
}

function bindEvents() {
  $$('.tab').forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.tab)));

  $('#newDeckBtn').addEventListener('click', createDeck);
  $('#renameDeckBtn').addEventListener('click', renameDeck);
  $('#deleteDeckBtn').addEventListener('click', deleteDeck);

  els.flashcard.addEventListener('click', flipCard);
  $('#flipBtn').addEventListener('click', flipCard);
  $('#nextBtn').addEventListener('click', nextCard);
  $('#prevBtn').addEventListener('click', prevCard);
  $('#resetProgressBtn').addEventListener('click', resetProgress);

  $('#speakKoBtn').addEventListener('click', () => speakKorean(currentCard()?.korean));
  $('#speakViBtn').addEventListener('click', () => speakVietnamese(currentCard()?.vietnamese));
  $('#speakBothBtn').addEventListener('click', () => speakBoth());

  els.autoPlayBtn.addEventListener('click', () => {
    if (els.autoPlayBtn.dataset.playing === 'true') stopAutoPlay();
    else startAutoPlay();
  });

  els.speedSelect.addEventListener('change', () => {
    if (els.autoPlayBtn.dataset.playing === 'true') startAutoPlay();
  });

  els.shuffleToggle.addEventListener('change', () => {
    state.shuffle = els.shuffleToggle.checked;
    resetModes();
    saveState();
    renderAll();
  });

  els.searchInput.addEventListener('input', () => {
    resetModes();
    renderAll();
  });

  $('#learnSpeakBtn').addEventListener('click', () => speakKorean(currentLearnCard()?.korean));
  $('#learnCheckBtn').addEventListener('click', checkLearnAnswer);
  $('#learnRevealBtn').addEventListener('click', revealLearnAnswer);
  $('#learnNextBtn').addEventListener('click', nextLearnQuestion);
  $('#learnResetBtn').addEventListener('click', resetLearn);
  els.learnAnswerInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      checkLearnAnswer();
    }
  });

  $('#reviewShowBtn').addEventListener('click', showReviewMeaning);
  $('#reviewKnownBtn').addEventListener('click', reviewKnown);
  $('#reviewHardBtn').addEventListener('click', reviewHard);
  $('#reviewResetBtn').addEventListener('click', resetReview);

  $('#quizSpeakBtn').addEventListener('click', () => speakKorean(currentQuizCard()?.korean));
  $('#quizNextBtn').addEventListener('click', nextQuizQuestion);
  $('#quizResetBtn').addEventListener('click', resetQuiz);

  els.form.addEventListener('submit', saveCard);
  $('#clearFormBtn').addEventListener('click', clearForm);
  $('#aiSuggestBtn').addEventListener('click', suggestWithAI);
  [els.koreanInput, els.vietnameseInput].forEach(input => input.addEventListener('input', renderPreview));

  $('#sortAzBtn').addEventListener('click', sortAz);
  $('#deleteSelectedBtn').addEventListener('click', deleteSelected);

  els.fileInput.addEventListener('change', event => importFile(event.target.files[0]));
  ['dragenter', 'dragover'].forEach(eventName => {
    els.uploadZone.addEventListener(eventName, event => {
      event.preventDefault();
      els.uploadZone.classList.add('dragging');
    });
  });
  ['dragleave', 'drop'].forEach(eventName => {
    els.uploadZone.addEventListener(eventName, event => {
      event.preventDefault();
      els.uploadZone.classList.remove('dragging');
    });
  });
  els.uploadZone.addEventListener('drop', event => importFile(event.dataTransfer.files[0]));

  $('#exportJsonBtn').addEventListener('click', exportJson);
  $('#exportCsvBtn').addEventListener('click', exportCsv);
  $('#copyTemplateBtn').addEventListener('click', copyTemplate);
  $('#resetAppBtn').addEventListener('click', resetApp);

  document.addEventListener('keydown', event => {
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;
    if (event.code === 'Space') {
      event.preventDefault();
      flipCard();
    }
    if (event.key === 'ArrowRight') nextCard();
    if (event.key === 'ArrowLeft') prevCard();
  });

  if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

async function checkAiHealth() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    els.aiStatus.textContent = data.aiEnabled
      ? `AI đã bật. Model: ${data.model}`
      : 'AI chưa bật: cần OPENAI_API_KEY trong file .env hoặc Render.';
  } catch {
    els.aiStatus.textContent = 'Đang chạy bản GitHub Pages: AI sẽ không hoạt động nếu chưa có backend.';
  }
}

bindEvents();
renderAll();
checkAiHealth();

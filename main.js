/**
 * main.js — RAGO STAND スライド生成 & 操作ロジック
 *
 * 依存: data.js（グローバル変数 SITE_DATA）
 */

/* ── 定数 ───────────────────────────────────────────────── */
const TRANSITION_LOCK_MS = 1700;   // 連続操作ロック時間（ms：初回表示）
const REVISIT_LOCK_MS    = 1400;   // 連続操作ロック時間（ms：表示済みスライド再表示）
const ENTER_ANIM_MS      = 2700;   // 入場アニメーション完了待機時間（ms）
const FADE_OUT_MS        = 600;    // フェードアウト時間（ms）
const FADE_IN_DELAY_MS   = 500;    // フェードイン開始までの待機時間（ms）
const SWIPE_THRESHOLD    = 40;     // タッチスワイプ判定（px）
const WHEEL_THRESHOLD    = 12;     // ホイール判定（deltaY の絶対値）

/* ── 状態 ───────────────────────────────────────────────── */
let currentIndex = 0;
let isTransitioning = false;
let touchStartY = 0;
let slides = [];           // DOM要素の配列
let totalSlides = 0;
const enterTimers = new Map(); // スライドごとの入場完了タイマーID

/* ── DOM 参照 ────────────────────────────────────────────── */
const container  = document.getElementById('slide-container');
const dotNavEl   = document.getElementById('dot-nav');

/* ────────────────────────────────────────────────────────── */
/* スライド DOM 生成                                          */
/* ────────────────────────────────────────────────────────── */

function buildSlides() {
  const data = SITE_DATA;
  const fragment = document.createDocumentFragment();

  /* ── 1. 表紙 ────────────────────────────────────────── */
  const cover = createCoverSlide(data.cover);
  cover.dataset.index = 0;
  fragment.appendChild(cover);

  /* ── 2〜6. キャラクター ─────────────────────────────── */
  data.characters.forEach((chara, i) => {
    const slide = createCharaSlide(chara, i + 1);
    slide.dataset.index = i + 1;
    fragment.appendChild(slide);
  });

  /* ── 7. 概要 ─────────────────────────────────────────── */
  const about = createAboutSlide(data.about);
  about.dataset.index = data.characters.length + 1;
  fragment.appendChild(about);

  /* ── 8. 動画 ─────────────────────────────────────────── */
  const video = createVideoSlide(data.youtubeId);
  video.dataset.index = data.characters.length + 2;
  fragment.appendChild(video);

  container.appendChild(fragment);

  slides = Array.from(container.querySelectorAll('.slide'));
  totalSlides = slides.length;
}

/* ── 表紙スライドを生成 ───────────────────────────────── */
function createCoverSlide(cover) {
  const slide = el('section', 'slide slide--cover');
  slide.setAttribute('aria-label', '表紙');

  /* 背景（画像が設定されている場合のみ表示）*/
  const bg = el('div', 'slide__bg');
  if (cover.bgImage) {
    bg.style.backgroundImage = `url('${cover.bgImage}')`;
    bg.style.backgroundSize = 'cover';
    bg.style.backgroundPosition = 'center';
    slide.style.setProperty('--img', `url('${cover.bgImage}')`);
  } else {
    bg.style.background = '#ffffff';
  }
  slide.appendChild(bg);

  /* ロゴ */
  const logo = el('img', 'cover__logo');
  logo.src = 'assets/logo.png';
  logo.alt = 'RAGO STAND ロゴ';
  slide.appendChild(logo);

  /* タイトル（空文字なら非表示）*/
  if (cover.title) {
    const title = el('p', 'cover__title');
    title.textContent = cover.title;
    slide.appendChild(title);
  }

  /* スワイプヒント */
  const hint = el('div', 'cover__hint');
  hint.setAttribute('aria-hidden', 'true');
  const hintText = el('span', 'cover__hint-text');
  hintText.textContent = 'スワイプしてめくる';
  const chevron = el('span', 'cover__chevron');
  chevron.textContent = '⌄';
  hint.appendChild(hintText);
  hint.appendChild(chevron);
  slide.appendChild(hint);

  return slide;
}

/* ── キャラクタースライドを生成 ──────────────────────── */
function createCharaSlide(chara, idx) {
  const slide = el('section', 'slide slide--chara');
  slide.setAttribute('aria-label', chara.name ? `キャラクター: ${chara.name}` : `キャラクター ${idx}`);

  /* 背景グラデーション */
  const bg = el('div', 'slide__bg');
  bg.style.background = `linear-gradient(to bottom, ${chara.from}, ${chara.to})`;
  slide.appendChild(bg);

  /* シェード */
  slide.appendChild(el('div', 'slide__shade'));

  /* キャラクター画像（または仮置き枠）*/
  if (chara.image) {
    const img = el('img', 'slide__char-img');
    img.src = chara.image;
    img.alt = chara.name ? `${chara.name}のキャラクター画像` : `キャラクター ${idx} の画像`;
    img.loading = 'lazy';
    /* 画像読み込みエラー時は仮置き枠へ差し替え */
    img.onerror = () => {
      img.replaceWith(makePlaceholder());
    };
    slide.appendChild(img);
  } else {
    slide.appendChild(makePlaceholder());
  }

  /* テキストブロック */
  const textBlock = el('div', 'slide__text-block');

  if (chara.name) {
    const nameEl = el('p', 'slide__char-name');
    nameEl.textContent = chara.name;
    textBlock.appendChild(nameEl);
  }

  const catchEl = el('p', 'slide__char-catch');
  catchEl.textContent = chara.catch;
  textBlock.appendChild(catchEl);

  const textEl = el('p', 'slide__char-text');
  textEl.textContent = chara.text;
  textBlock.appendChild(textEl);

  slide.appendChild(textBlock);
  return slide;
}

/* ── キャラクター仮置き枠 ────────────────────────────── */
function makePlaceholder() {
  const ph = el('div', 'slide__char-placeholder');
  const sp = el('span', '');
  sp.textContent = '切り抜き画像の位置';
  ph.appendChild(sp);
  return ph;
}

/* ── 概要スライドを生成 ───────────────────────────────── */
function createAboutSlide(about) {
  const slide = el('section', 'slide slide--about');
  slide.setAttribute('aria-label', about.heading);

  /* 背景 */
  const bg = el('div', 'slide__bg');
  bg.style.background = 'linear-gradient(to bottom, #ffffff, #0d0d0d)';
  slide.appendChild(bg);

  /* シェード */
  slide.appendChild(el('div', 'slide__shade'));

  /* 小ロゴ */
  const logo = el('img', 'about__logo');
  logo.src = 'assets/logo.png';
  logo.alt = 'RAGO STAND ロゴ';
  slide.appendChild(logo);

  /* 見出し */
  const heading = el('h2', 'about__heading');
  heading.textContent = about.heading;
  slide.appendChild(heading);

  /* コンセプト */
  const bookSec = el('div', 'about__section');
  const bookLabel = el('span', 'about__section-label');
  bookLabel.textContent = 'コンセプト';
  const bookText = el('p', 'about__section-text');
  bookText.textContent = about.book;
  bookSec.appendChild(bookLabel);
  bookSec.appendChild(bookText);
  slide.appendChild(bookSec);

  /* 現在地 */
  const standSec = el('div', 'about__section');
  const standLabel = el('span', 'about__section-label');
  standLabel.textContent = '現在地';
  const standText = el('p', 'about__section-text');
  standText.textContent = about.stand;
  standSec.appendChild(standLabel);
  standSec.appendChild(standText);
  slide.appendChild(standSec);

  return slide;
}

/* ── 動画スライドを生成 ──────────────────────────────── */
function createVideoSlide(youtubeId) {
  const slide = el('section', 'slide slide--video');
  slide.setAttribute('aria-label', '動画');

  /* 背景 */
  const bg = el('div', 'slide__bg');
  bg.style.background = 'linear-gradient(to bottom, #ffffff, #0d0d0d)';
  slide.appendChild(bg);

  /* シェード */
  slide.appendChild(el('div', 'slide__shade'));

  /* 動画枠 */
  const wrapper = el('div', 'video__wrapper');
  wrapper.id = 'video-wrapper';

  if (youtubeId) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${youtubeId}?playsinline=1&rel=0`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('title', 'RAGO STAND 動画');
    wrapper.appendChild(iframe);
  } else {
    const ph = el('div', 'video__placeholder');
    ph.textContent = 'ここにYouTube動画が入ります';
    wrapper.appendChild(ph);
  }

  slide.appendChild(wrapper);
  return slide;
}

/* ────────────────────────────────────────────────────────── */
/* ドットナビゲーション                                       */
/* ────────────────────────────────────────────────────────── */

function buildDotNav() {
  dotNavEl.innerHTML = '';
  slides.forEach((_, i) => {
    const btn = el('button', 'dot-nav__dot');
    btn.setAttribute('aria-label', `スライド ${i + 1} へ移動`);
    btn.addEventListener('click', () => {
      if (!isTransitioning && i !== currentIndex) {
        goTo(i);
      }
    });
    dotNavEl.appendChild(btn);
  });
  updateDots();
}

function updateDots() {
  Array.from(dotNavEl.children).forEach((btn, i) => {
    btn.classList.toggle('current', i === currentIndex);
  });
  /* body クラスでスライドインデックスを管理（表紙の白背景対応）*/
  document.body.className = `slide-${currentIndex}`;
}

/* ────────────────────────────────────────────────────────── */
/* スライド切り替え                                           */
/* ────────────────────────────────────────────────────────── */

/** 未完了の入場完了タイマーをキャンセル */
function clearEnterTimer(slide) {
  const timerId = enterTimers.get(slide);
  if (timerId !== undefined) {
    clearTimeout(timerId);
    enterTimers.delete(slide);
  }
}

/** 初回入場アニメーション完了後に entering を外し shown を付与 */
function scheduleSlideShown(slide) {
  clearEnterTimer(slide);
  const timerId = setTimeout(() => {
    enterTimers.delete(slide);
    slide.classList.remove('entering');
    slide.classList.add('shown');
  }, ENTER_ANIM_MS);
  enterTimers.set(slide, timerId);
}

function goTo(nextIndex) {
  if (isTransitioning) return;
  if (nextIndex < 0 || nextIndex >= totalSlides) return;
  if (nextIndex === currentIndex) return;

  isTransitioning = true;

  const current = slides[currentIndex];
  const next    = slides[nextIndex];
  const alreadyShown = next.classList.contains('shown');

  /* フェードアウト（消える側）& 未完了タイマーをキャンセル */
  clearEnterTimer(current);
  current.classList.remove('active', 'entering');

  /* 0.5秒後に次のスライドをフェードイン */
  setTimeout(() => {
    currentIndex = nextIndex;
    clearEnterTimer(next);

    if (alreadyShown) {
      /* 一度表示済みのスライドは再アニメーションさせず滑らかにフェードイン */
      next.classList.remove('entering');
      next.classList.add('active');
    } else {
      /* 初回表示（または途中離脱したスライド）は入場アニメーション付きで表示 */
      next.classList.add('active', 'entering');
      scheduleSlideShown(next);
    }

    updateDots();

    /* ロック解除 */
    const lockDuration = alreadyShown ? REVISIT_LOCK_MS : TRANSITION_LOCK_MS;
    setTimeout(() => {
      isTransitioning = false;
    }, lockDuration - FADE_IN_DELAY_MS);

  }, FADE_IN_DELAY_MS);
}

function next() { goTo(currentIndex + 1); }
function prev() { goTo(currentIndex - 1); }

/* ────────────────────────────────────────────────────────── */
/* 入力イベント                                               */
/* ────────────────────────────────────────────────────────── */

/* ── タッチ ──────────────────────────────────────────── */
document.addEventListener('touchstart', (e) => {
  touchStartY = e.changedTouches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  if (isOnVideoWrapper(e.target)) return;   // 動画上は無視

  const dy = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(dy) < SWIPE_THRESHOLD) return;
  dy > 0 ? next() : prev();
}, { passive: true });

/* ── ホイール ────────────────────────────────────────── */
document.addEventListener('wheel', (e) => {
  if (isOnVideoWrapper(e.target)) return;   // 動画上は無視
  if (Math.abs(e.deltaY) <= WHEEL_THRESHOLD) return;
  e.preventDefault();
  e.deltaY > 0 ? next() : prev();
}, { passive: false });

/* ── キーボード ──────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowDown':
    case 'PageDown':
    case ' ':
      e.preventDefault();
      next();
      break;
    case 'ArrowUp':
    case 'PageUp':
      e.preventDefault();
      prev();
      break;
  }
});

/* ── 動画ラッパー上かどうか判定 ──────────────────────── */
function isOnVideoWrapper(target) {
  const wrapper = document.getElementById('video-wrapper');
  return wrapper && wrapper.contains(target);
}

/* ────────────────────────────────────────────────────────── */
/* ユーティリティ                                              */
/* ────────────────────────────────────────────────────────── */

/** 要素を作成 */
function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

/* ────────────────────────────────────────────────────────── */
/* 初期化                                                      */
/* ────────────────────────────────────────────────────────── */

function init() {
  buildSlides();
  buildDotNav();

  /* 最初のスライドを表示（entering アニメーション付き）*/
  if (slides.length > 0) {
    slides[0].classList.add('active', 'entering');
    document.body.className = 'slide-0';
    scheduleSlideShown(slides[0]);
  }
}

document.addEventListener('DOMContentLoaded', init);

/**
 * RAGOStand - Minimal Interactions
 * Scroll reveal animations using Intersection Observer
 */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // Archive Accordion — 写真部分のみ表示 → タップで全体展開
  // ============================================================
  const archiveItems = document.querySelectorAll('.archive__item');

  /**
   * 画像の自然な縦横比から「写真部分の高さ」を推定し
   * CSS カスタムプロパティ --archive-photo-height にセットする。
   *
   * 各 archive 画像は「上部: 写真」「下部: テキスト」の合成 PNG。
   * 写真部分が全体の約 60% を占める前提で高さを計算します。
   * 実際の画像比率に応じてこの値(0.60)を調整してください。
   */
  const PHOTO_RATIO = 0.60; // 画像全体に占める写真部分の割合

  function setPhotoHeight(item) {
    const img = item.querySelector('.archive__item-image');
    if (!img) return;

    const applyHeight = () => {
      // カードの現在の描画幅を取得
      const cardWidth = item.offsetWidth;
      // 画像の自然な縦横比から全体の表示高さを算出
      const naturalRatio = img.naturalHeight / img.naturalWidth;
      const totalDisplayHeight = cardWidth * naturalRatio;
      // 写真部分の高さ = 全体高さ × PHOTO_RATIO
      const photoHeight = Math.round(totalDisplayHeight * PHOTO_RATIO);

      item.style.setProperty('--archive-photo-height', photoHeight + 'px');
    };

    if (img.complete && img.naturalWidth > 0) {
      applyHeight();
    } else {
      img.addEventListener('load', applyHeight);
    }
  }

  // ウィンドウリサイズ時に再計算
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      archiveItems.forEach(setPhotoHeight);
    }, 150);
  });

  // 開閉トグル処理
  function toggleItem(item) {
    const isExpanded = item.classList.contains('is-expanded');

    if (isExpanded) {
      // 閉じる
      item.classList.remove('is-expanded');
      item.setAttribute('aria-expanded', 'false');
      // aria-label を「展開」に戻す
      const label = item.getAttribute('aria-label') || '';
      item.setAttribute('aria-label', label.replace('を閉じる', 'を展開'));
    } else {
      // 開く
      item.classList.add('is-expanded');
      item.setAttribute('aria-expanded', 'true');
      // aria-label を「閉じる」に変更
      const label = item.getAttribute('aria-label') || '';
      item.setAttribute('aria-label', label.replace('を展開', 'を閉じる'));
    }
  }

  archiveItems.forEach(item => {
    // 写真高さを初期設定
    setPhotoHeight(item);

    // クリックイベント
    item.addEventListener('click', () => toggleItem(item));

    // キーボード操作(Enter / Space)
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleItem(item);
      }
    });
  });


  // Scroll Reveal Animation
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Parallax effect on hero image (subtle)
  const heroImage = document.querySelector('.hero__image-wrapper');

  if (heroImage) {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.pageYOffset;
          const rate = scrolled * 0.3;

          if (scrolled < window.innerHeight) {
            heroImage.style.transform = `translate(-50%, calc(-50% + ${rate}px))`;
            heroImage.style.opacity = Math.max(0.7 - (scrolled / window.innerHeight) * 0.5, 0.2);
          }

          ticking = false;
        });

        ticking = true;
      }
    });
  }
});

// memberProfile.js（置き換え用：DOMContentLoaded 内で初期化する安全な実装）
document.addEventListener('DOMContentLoaded', () => {
  // --- 要素取得（DOMContentLoaded 後なので安全） ---
  const profiles = Array.from(document.querySelectorAll('.profile'));
  const thumbnails = Array.from(document.querySelectorAll('.thumbnail'));
  const modal = document.querySelector('.modal');
  const modalImg = modal ? modal.querySelector('.modal-avatar') : null;
  const navLeft = document.querySelector('.nav.left');
  const navRight = document.querySelector('.nav.right');
  const modalName = document.querySelector('.modal-name');
  const closeBtn = document.querySelector('.modal .close');
  const modalLinks = document.querySelector('.modal-links');
  const modalHighlight = modal ? modal.querySelector('.modal-highlight iframe') : null;

  // 初期インデックス（active クラスが付いていればそれを使う）
  let currentIndex = profiles.findIndex(p => p.classList.contains('active'));
  if (currentIndex < 0) currentIndex = 0;

  // --- 表示切替関数 ---
  function showProfile(index) {
    if (!profiles.length) return;
    index = ((index % profiles.length) + profiles.length) % profiles.length; // 安全な正規化
    profiles.forEach(p => p.classList.remove('active'));
    thumbnails.forEach(t => t.classList.remove('active'));
    profiles[index].classList.add('active');
    if (thumbnails[index]) thumbnails[index].classList.add('active');
    currentIndex = index;
  }

  // サムネクリック
  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener('click', () => showProfile(index));
  });

  // ナビボタン
  navLeft?.addEventListener('click', () => {
    showProfile(currentIndex - 1);
  });
  navRight?.addEventListener('click', () => {
    showProfile(currentIndex + 1);
  });

  // キーボード操作
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') showProfile(currentIndex - 1);
    else if (e.key === 'ArrowRight') showProfile(currentIndex + 1);
    else if (e.key === 'Escape') {
      if (modal) {
        if (modalHighlight) modalHighlight.src = "";
        modal.style.display = 'none';
      }
    }
  });

  // --- アバタークリックでモーダル表示（リンク生成・ハイライト埋め込み） ---
  document.querySelectorAll('.avatar').forEach(avatar => {
    avatar.addEventListener('click', () => {
      if (modalImg) modalImg.src = avatar.dataset.large || avatar.src;

      const profile = avatar.closest('.profile');
      const name = profile ? (profile.querySelector('.name')?.textContent || '') : '';
      if (modalName) modalName.textContent = name;

      // リンク欄クリア
      if (modalLinks) modalLinks.innerHTML = "";

      // YouTube
      if (avatar.dataset.youtube && modalLinks) {
        const ytLink = document.createElement("a");
        ytLink.href = avatar.dataset.youtube;
        ytLink.target = "_blank";
        ytLink.className = "link youtube";
        ytLink.innerHTML = `<img src="../../../img/youtube.png" class="icon" alt="YouTube">YouTube`;
        modalLinks.appendChild(ytLink);
      }

      // Twitch
      if (avatar.dataset.twitch && modalLinks) {
        const twLink = document.createElement("a");
        twLink.href = avatar.dataset.twitch;
        twLink.target = "_blank";
        twLink.className = "link twitch";
        twLink.innerHTML = `<img src="../../../img/twitch.png" class="icon" alt="Twitch">Twitch`;
        modalLinks.appendChild(twLink);
      }

      // X
      if (avatar.dataset.x && modalLinks) {
        const xLink = document.createElement("a");
        xLink.href = avatar.dataset.x;
        xLink.target = "_blank";
        xLink.className = "link x";
        xLink.innerHTML = `<img src="../../../img/X.png" class="icon" alt="X">X`;
        modalLinks.appendChild(xLink);
      }

      // ハイライト動画（YouTube埋め込み）
      if (modalHighlight) {
        let url = (avatar.dataset.highlight || "").trim();
        let videoId = null;
        if (url.includes("watch?v=")) videoId = url.split("watch?v=")[1].split("&")[0];
        else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
        else if (url.includes("embed/")) videoId = url.split("embed/")[1].split("?")[0];

        if (videoId) {
          modalHighlight.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
          modalHighlight.title = `${name} の動画`;
        } else {
          modalHighlight.src = "";
          modalHighlight.title = "";
        }
      }

      if (modal) modal.style.display = 'flex';
    });
  });

  // 閉じる処理
  closeBtn?.addEventListener('click', () => {
    if (modalHighlight) modalHighlight.src = "";
    if (modal) modal.style.display = 'none';
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      if (modalHighlight) modalHighlight.src = "";
      modal.style.display = 'none';
    }
  });

  // --- ナビテキスト等（main.js に依存する定数がある場合はそれを使い、無ければフォールバック） ---
  try {
    const scheduleEl = document.getElementById("schedule");
    if (scheduleEl && typeof SCHEDULE !== 'undefined') scheduleEl.textContent = SCHEDULE;

    const memberEl = document.getElementById("member");
    if (memberEl && typeof MEMBER_PROFILE !== 'undefined') memberEl.textContent = MEMBER_PROFILE;

    const userEl = document.getElementById("user");
    if (userEl && typeof USER !== 'undefined') userEl.textContent = USER;

    const ornerElem = document.getElementById("orner");
    if (ornerElem && typeof ORNER !== 'undefined') ornerElem.textContent = ORNER;

    const subOrnerElem = document.getElementById("subOrner");
    if (subOrnerElem && typeof SUB_ORNER !== 'undefined') subOrnerElem.textContent = SUB_ORNER;
  } catch (e) {
    // 万が一 main.js 側で参照エラーなど起きてもここで止める
    console.warn('menu text assignment skipped:', e);
  }

  // --- ここが重要：.streamer に部門名を入れる（ROLE_STREAMER があればそれを使う） ---
  const streamerText = (typeof ROLE_STREAMER !== 'undefined') ? ROLE_STREAMER : 'ストリーマー部門';
  document.querySelectorAll('.streamer').forEach(elem => { elem.textContent = streamerText; });

  // 最初の表示を確実に反映
  showProfile(currentIndex);
});

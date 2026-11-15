// ==========================================================================
// CONFIGURATION & GLOBAL STATE
// ==========================================================================
const mantraPlaylistEmbedUrl = "https://www.youtube.com/embed/videoseries?list=PL0olZhEpCi6dodNRfIbtT4-2Xe4yqtXUX&autoplay=1";

const sessionStartHour = 21;
const sessionStartMinute = 0;
const sessionDurationMinutes = 30;

let libraryData = { books: [] };
let selectedBookIndex = -1;
let selectedChapterIndex = -1;

let readingData = [];
let chapterVideoFile = null; 
let currentActiveIndex = -1;
let currentParaImages = [];
let currentParaVideos = [];
let currentImageSubIndex = 0;
let currentActiveMode = 'image'; 

// DOM References
const bookTitleText = document.getElementById('bookTitleText');
const chapterTitleText = document.getElementById('chapterTitleText');
const displayClock = document.getElementById('displayClock');
const displayDate = document.getElementById('displayDate');
const timeProgressFill = document.getElementById('timeProgressFill');
const readingContainer = document.getElementById('readingContainer');
const welcomeContainer = document.getElementById('welcomeContainer');
const dashboardGrid = document.getElementById('dashboardGrid');
const mediaPanel = document.getElementById('mediaPanel');
const paragraphImage = document.getElementById('paragraphImage');
const videoContainer = document.getElementById('videoContainer');
const mediaToggleBar = document.getElementById('mediaToggleBar');
const showImgTabBtn = document.getElementById('showImgTabBtn');
const showVideoTabBtn = document.getElementById('showVideoTabBtn');
const thumbnailGallery = document.getElementById('thumbnailGallery');
const imageCountBadge = document.getElementById('imageCountBadge');
const imgPrevBtn = document.getElementById('imgPrevBtn');
const imgNextBtn = document.getElementById('imgNextBtn');
const menuPopup = document.getElementById('menuPopup');
const videoModal = document.getElementById('videoModal');
const mantraIframe = document.getElementById('mantraIframe');
const chantingModal = document.getElementById('chantingModal');

// ==========================================================================
// MARQUEE DYNAMIC SCROLL CALCULATOR
// ==========================================================================
function updateHeaderMarquee(element, text) {
  element.textContent = text;
  element.classList.remove('marquee-active');
  element.style.transform = 'translateX(0%)';

  // Allow DOM to compute bounding box
  requestAnimationFrame(() => {
    const container = element.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const textWidth = element.scrollWidth;

    if (textWidth > containerWidth) {
      const overflowDistance = textWidth - containerWidth + 15; // 15px safety margin
      const scrollPercentage = (overflowDistance / textWidth) * 100;
      
      // Calculate speed: 30px per second for smooth reading
      const duration = Math.max(6, Math.round(overflowDistance / 25));

      element.style.setProperty('--scroll-distance', `-${scrollPercentage}%`);
      element.style.setProperty('--scroll-duration', `${duration}s`);
      element.classList.add('marquee-active');
    }
  });
}

// ==========================================================================
// 1. CLOCK & GREEN PROGRESS FILL
// ==========================================================================
function updateClockAndDate() {
  const now = new Date();
  displayClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  displayDate.textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sessionStartHour, sessionStartMinute, 0).getTime();
  const endMs = startMs + (sessionDurationMinutes * 60 * 1000);
  const currentMs = now.getTime();

  let fillPercentage = 0;
  if (currentMs >= endMs) {
    fillPercentage = 100;
  } else if (currentMs > startMs) {
    fillPercentage = ((currentMs - startMs) / (endMs - startMs)) * 100;
  }
  timeProgressFill.style.width = `${fillPercentage.toFixed(2)}%`;
}

// ==========================================================================
// 2. LIBRARY & DYNAMIC MEDIA LOADER ENGINE
// ==========================================================================
async function fetchReadingData() {
  try {
    const response = await fetch('para.json');
    libraryData = await response.json();
  } catch (error) {
    console.error("Error loading library json:", error);
  }
}

async function loadCurrentChapter() {
  try {
    if (selectedBookIndex === -1 || selectedChapterIndex === -1) return;

    const currentBook = libraryData.books[selectedBookIndex];
    if (!currentBook) return;

    const currentChapter = currentBook.chapters[selectedChapterIndex];
    if (!currentChapter) return;

    updateHeaderMarquee(bookTitleText, currentBook.bookName);
    updateHeaderMarquee(chapterTitleText, currentChapter.chapterName);

    chapterVideoFile = currentChapter.videoFile || null;

    if (currentChapter.txtFile) {
      const safePath = encodeURI(currentChapter.txtFile);
      const txtResponse = await fetch(safePath);
      const rawText = await txtResponse.text();
      readingData = parseTxtContent(rawText);
    } else {
      readingData = currentChapter.paragraphs || [];
    }

    welcomeContainer.style.display = 'none';
    dashboardGrid.style.display = 'flex';

    renderContinuousReading();
    if (readingData.length > 0) activateParagraph(0);
  } catch (error) {
    console.error("Error loading chapter text file:", error);
  }
}

// PARSER: Scans for explicit [IMAGE: ...] and [VIDEO: ...] tags
function parseTxtContent(rawText) {
  const rawBlocks = rawText.split(/\n\s*\n/);
  const parsedParagraphs = [];

  rawBlocks.forEach(block => {
    let cleanText = block.trim();
    let extractedImages = [];
    let extractedVideos = [];

    const imageMatch = cleanText.match(/\[IMAGE:\s*(.*?)\]/i);
    if (imageMatch) {
      extractedImages = imageMatch[1].split(',').map(url => url.trim());
      cleanText = cleanText.replace(/\[IMAGE:\s*.*?\]/gi, '').trim();
    }

    const videoMatch = cleanText.match(/\[VIDEO:\s*(.*?)\]/i);
    if (videoMatch) {
      extractedVideos = videoMatch[1].split(',').map(url => url.trim());
      cleanText = cleanText.replace(/\[VIDEO:\s*.*?\]/gi, '').trim();
    }

    if (cleanText.length > 0) {
      const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const isMultiLineVerse = lines.length > 1 && !cleanText.includes('“') && !cleanText.includes('"');

      parsedParagraphs.push({
        paragraph: isMultiLineVerse ? lines.join('\n') : cleanText.replace(/\n+/g, ' '),
        isVerse: isMultiLineVerse,
        images: extractedImages,
        videos: extractedVideos
      });
    }
  });

  return parsedParagraphs;
}

// ==========================================================================
// 3. BOOK & CHAPTER SELECTOR MODALS
// ==========================================================================
function openBookSelector() {
  menuPopup.classList.remove('open');
  const container = document.getElementById('bookListContainer');
  container.innerHTML = '';

  if (!libraryData.books || libraryData.books.length === 0) return;

  libraryData.books.forEach((book, bIndex) => {
    const card = document.createElement('div');
    card.className = 'picker-card';
    card.innerHTML = `<span>📖 ${book.bookName}</span> <span>${book.chapters.length} Chapters ›</span>`;
    card.onclick = () => {
      selectedBookIndex = bIndex;
      selectedChapterIndex = 0;
      closeModal('bookModal');
      openChapterSelector();
    };
    container.appendChild(card);
  });

  document.getElementById('bookModal').classList.add('open');
}

function openChapterSelector() {
  menuPopup.classList.remove('open');
  
  if (selectedBookIndex === -1) {
    openBookSelector();
    return;
  }

  const container = document.getElementById('chapterListContainer');
  container.innerHTML = '';

  const currentBook = libraryData.books[selectedBookIndex];
  if (!currentBook) return;

  currentBook.chapters.forEach((chap, cIndex) => {
    const card = document.createElement('div');
    card.className = 'picker-card';
    card.innerHTML = `<span>📄 ${chap.chapterName}</span> <span>Select ›</span>`;
    card.onclick = () => {
      selectedChapterIndex = cIndex;
      closeModal('chapterModal');
      loadCurrentChapter();
    };
    container.appendChild(card);
  });

  document.getElementById('chapterModal').classList.add('open');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('open');
}

// ==========================================================================
// 4. PARAGRAPH & WORD RENDERING ENGINE
// ==========================================================================
function renderContinuousReading() {
  readingContainer.innerHTML = '';

  readingData.forEach((item, index) => {
    const paraEl = document.createElement('div');
    paraEl.className = 'paragraph-block';
    paraEl.dataset.index = index;

    let text = item.paragraph;
    const isSanskrit = item.isVerse || (/^(sukham|buddhi-grāhyam|vetti|sthitaś|sa niścayena|saṅkalpa|manasaivendriya|śanaiḥ|ātma-saṁsthaṁ|yato yato|praśānta|yuñjann|taṁ vidyād|yaṁ labdhvā)/i.test(text) && !text.includes('“'));

    if (isSanskrit) {
      paraEl.classList.add('sanskrit-verse-block');

      const lines = text.split('\n');
      lines.forEach(line => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'sanskrit-verse-line';

        const tokens = line.split(/(\s+)/);
        tokens.forEach(token => {
          if (token.trim().length === 0) {
            lineDiv.appendChild(document.createTextNode(token));
          } else {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            wordSpan.textContent = token;

            wordSpan.addEventListener('mouseenter', function() {
              clearWordHighlights();
              this.classList.add('highlighted');
            });

            lineDiv.appendChild(wordSpan);
          }
        });

        paraEl.appendChild(lineDiv);
      });
    } else {
      let isInsideQuotes = false;
      const tokens = text.split(/(\s+)/);

      tokens.forEach(token => {
        if (token.trim().length === 0) {
          paraEl.appendChild(document.createTextNode(token));
        } else {
          const wordSpan = document.createElement('span');
          wordSpan.className = 'word';
          wordSpan.textContent = token;

          if (token.includes('“') || token.includes('"')) {
            isInsideQuotes = true;
          }

          if (isInsideQuotes) {
            wordSpan.classList.add('quoted-text');
          }

          if (token.includes('”') || (isInsideQuotes && token.endsWith('"'))) {
            isInsideQuotes = false;
          }

          wordSpan.addEventListener('mouseenter', function() {
            clearWordHighlights();
            this.classList.add('highlighted');
          });

          paraEl.appendChild(wordSpan);
        }
      });
    }

    paraEl.addEventListener('mouseenter', function() {
      activateParagraph(index);
    });

    readingContainer.appendChild(paraEl);
  });
}

function clearWordHighlights() {
  const currentHighlighted = readingContainer.querySelectorAll('.word.highlighted');
  currentHighlighted.forEach(el => el.classList.remove('highlighted'));
}

// ==========================================================================
// 5. MEDIA ENGINE
// ==========================================================================
function activateParagraph(index) {
  if (currentActiveIndex === index) return;
  currentActiveIndex = index;

  const item = readingData[index];
  let validImages = [];
  let validVideos = [];

  if (item) {
    if (Array.isArray(item.images)) validImages = item.images.filter(img => img);
    else if (item.image) validImages = [item.image];

    if (Array.isArray(item.videos) && item.videos.length > 0) {
      validVideos = item.videos.filter(v => v);
    } else if (item.video) {
      validVideos = [item.video];
    } else if (chapterVideoFile) {
      validVideos = [chapterVideoFile];
    }
  }

  currentParaImages = validImages;
  currentParaVideos = validVideos;

  if (validImages.length > 0 || validVideos.length > 0) {
    if (validImages.length > 0 && validVideos.length > 0) {
      mediaToggleBar.style.display = 'flex';
      currentActiveMode = 'image';
      showImgTabBtn.classList.add('active');
      showVideoTabBtn.classList.remove('active');
    } else if (validVideos.length > 0) {
      mediaToggleBar.style.display = 'none';
      currentActiveMode = 'video';
    } else {
      mediaToggleBar.style.display = 'none';
      currentActiveMode = 'image';
    }

    currentImageSubIndex = 0;
    updateMediaGallery();
    mediaPanel.classList.remove('hidden-panel');
  } else {
    mediaPanel.classList.add('hidden-panel');
    paragraphImage.src = "";
    videoContainer.innerHTML = "";
  }
}

function setMediaMode(mode) {
  currentActiveMode = mode;
  if (mode === 'image') {
    showImgTabBtn.classList.add('active');
    showVideoTabBtn.classList.remove('active');
  } else {
    showVideoTabBtn.classList.add('active');
    showImgTabBtn.classList.remove('active');
  }
  updateMediaGallery();
}

function updateMediaGallery() {
  if (currentActiveMode === 'image' && currentParaImages.length > 0) {
    paragraphImage.style.display = 'block';
    videoContainer.style.display = 'none';
    videoContainer.innerHTML = ""; 

    const totalImgs = currentParaImages.length;
    if (totalImgs > 1) {
      imageCountBadge.style.display = 'block';
      imageCountBadge.textContent = `${currentImageSubIndex + 1} / ${totalImgs}`;
      imgPrevBtn.style.display = 'flex';
      imgNextBtn.style.display = 'flex';
      thumbnailGallery.style.display = 'flex';
    } else {
      imageCountBadge.style.display = 'none';
      imgPrevBtn.style.display = 'none';
      imgNextBtn.style.display = 'none';
      thumbnailGallery.style.display = 'none';
    }

    paragraphImage.src = currentParaImages[currentImageSubIndex];

    thumbnailGallery.innerHTML = '';
    if (totalImgs > 1) {
      currentParaImages.forEach((imgUrl, idx) => {
        const thumb = document.createElement('div');
        thumb.className = `thumbnail-item ${idx === currentImageSubIndex ? 'active' : ''}`;
        thumb.innerHTML = `<img src="${imgUrl}" />`;
        thumb.onclick = () => {
          currentImageSubIndex = idx;
          updateMediaGallery();
        };
        thumbnailGallery.appendChild(thumb);
      });
    }
  } else if (currentActiveMode === 'video' && currentParaVideos.length > 0) {
    paragraphImage.style.display = 'none';
    videoContainer.style.display = 'block';
    imageCountBadge.style.display = 'none';
    imgPrevBtn.style.display = 'none';
    imgNextBtn.style.display = 'none';
    thumbnailGallery.style.display = 'none';

    const videoUrl = currentParaVideos[0];
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const embedUrl = videoUrl.replace('watch?v=', 'embed/');
      videoContainer.innerHTML = `<iframe src="${embedUrl}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen style="width:100%; height:100%;"></iframe>`;
    } else {
      videoContainer.innerHTML = `<video src="${encodeURI(videoUrl)}" controls autoplay style="width:100%; height:100%; object-fit:contain;"></video>`;
    }
  }
}

function navigateImage(direction) {
  if (currentActiveMode === 'image' && currentParaImages.length > 1) {
    currentImageSubIndex = (currentImageSubIndex + direction + currentParaImages.length) % currentParaImages.length;
    updateMediaGallery();
  }
}

// ==========================================================================
// 6. 3-DOT POPUP MENU & MODAL CONTROLLERS
// ==========================================================================
function toggleMenuPopup(event) {
  event.stopPropagation();
  menuPopup.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  if (!menuPopup.contains(e.target)) {
    menuPopup.classList.remove('open');
  }
});

function openMantraVideo() {
  menuPopup.classList.remove('open');
  mantraIframe.src = mantraPlaylistEmbedUrl;
  videoModal.classList.add('open');
}

function closeMantraVideo() {
  videoModal.classList.remove('open');
  mantraIframe.src = "";
}

function openChantingCounter() {
  menuPopup.classList.remove('open');
  chantingModal.classList.add('open');
  calculateBeadInterval();
}

function closeChantingCounter() {
  stopAutoCount();
  chantingModal.classList.remove('open');
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}

// ==========================================================================
// 7. JAPA YAJNA CHANTING COUNTER LOGIC
// ==========================================================================
let currentBeads = 0;
let totalBeads = 0;
let rounds = 0;
const targetRounds = 16;
let autoCounterInterval = null;
let beadIntervalMs = 3240.74;

function increaseCount() {
  if (rounds < targetRounds) {
    currentBeads++;
    totalBeads++;

    document.getElementById("beadCount").innerText = currentBeads + " / 108";
    document.getElementById("totalBeads").innerText = totalBeads;

    if (currentBeads === 108) {
      rounds++;
      currentBeads = 0;

      document.getElementById("roundCount").innerText = rounds;
      document.getElementById("beadCount").innerText = currentBeads + " / 108";
      document.getElementById("message").innerText = "🎉 Round " + rounds + " completed! Hare Krishna!";

      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }

      let remainingRounds = targetRounds - rounds;

      if (remainingRounds > 0) {
        document.getElementById("targetStatus").innerText = "Target: " + remainingRounds + " Rounds Remaining";
      } else {
        document.getElementById("targetStatus").innerText = "🎉 16 Rounds Completed Today! Haribol!";
        document.getElementById("message").innerText = "🌸 All 16 rounds completed! Wonderful seva!";
        stopAutoCount();
      }
    }
  }
}

function resetCount() {
  currentBeads = 0;
  totalBeads = 0;
  rounds = 0;

  stopAutoCount();

  document.getElementById("beadCount").innerText = "0 / 108";
  document.getElementById("totalBeads").innerText = "0";
  document.getElementById("roundCount").innerText = "0";
  document.getElementById("targetStatus").innerText = "Target: 16 Rounds Remaining";
  document.getElementById("message").innerText = "";
}

function calculateBeadInterval() {
  let minutes = parseInt(document.getElementById("minutesInput").value) || 0;
  let seconds = parseInt(document.getElementById("secondsInput").value) || 0;

  let totalSeconds = (minutes * 60) + seconds;

  if (totalSeconds <= 0) {
    totalSeconds = 350;
    document.getElementById("minutesInput").value = 5;
    document.getElementById("secondsInput").value = 50;
  }

  let secondsPerBead = totalSeconds / 108;
  beadIntervalMs = secondsPerBead * 1000;

  document.getElementById("intervalDisplay").innerText =
    "1 Bead = " + secondsPerBead.toFixed(3) + " seconds";
}

function startAutoCount() {
  if (autoCounterInterval !== null) return;

  if (rounds >= targetRounds) {
    document.getElementById("message").innerText = "🌸 All 16 rounds already completed today!";
    return;
  }

  calculateBeadInterval();
  document.getElementById("autoStatus").innerText = "Auto Counter: Running ▶️";

  autoCounterInterval = setInterval(function () {
    increaseCount();
  }, beadIntervalMs);
}

function stopAutoCount() {
  if (autoCounterInterval !== null) {
    clearInterval(autoCounterInterval);
    autoCounterInterval = null;
  }
  document.getElementById("autoStatus").innerText = "Auto Counter: Stopped";
}

document.getElementById("minutesInput").addEventListener("input", calculateBeadInterval);
document.getElementById("secondsInput").addEventListener("input", calculateBeadInterval);

// Re-check marquee width when screen resizes
window.addEventListener('resize', () => {
  if (selectedBookIndex !== -1) {
    const currentBook = libraryData.books[selectedBookIndex];
    const currentChapter = currentBook.chapters[selectedChapterIndex];
    if (currentBook) updateHeaderMarquee(bookTitleText, currentBook.bookName);
    if (currentChapter) updateHeaderMarquee(chapterTitleText, currentChapter.chapterName);
  }
});

// ==========================================================================
// 8. INITIALIZATION
// ==========================================================================
function init() {
  updateClockAndDate();
  setInterval(updateClockAndDate, 1000);
  fetchReadingData();
}

window.addEventListener('DOMContentLoaded', init);

const detailBox = document.getElementById('movieDetail');

function getMovieId() {
  return new URLSearchParams(window.location.search).get('id');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getItemType(item) {
  return item.type === 'series' ? 'Web Series' : 'Movie';
}

function getPoster(item) {
  return item.poster || 'assets/posters/no-poster.jpg';
}

function getQualityText(item) {
  if (item.type === 'series') {
    const seasons = Array.isArray(item.seasons) ? item.seasons : [];
    const episodeCount = seasons.reduce((total, season) => total + ((season.episodes || []).length), 0);
    return `${seasons.length || 0} Season${seasons.length === 1 ? '' : 's'} • ${episodeCount} Episode${episodeCount === 1 ? '' : 's'}`;
  }
  const qualities = Array.isArray(item.qualities) ? item.qualities : [];
  return qualities.map((q) => q.quality).filter(Boolean).join(' • ') || 'Quality not added';
}

function imageFallback(img) {
  img.onerror = null;
  img.classList.add('image-missing');
  img.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">
      <rect width="400" height="600" fill="#dfe8f7"/>
      <text x="200" y="285" text-anchor="middle" font-family="Arial" font-size="28" fill="#607086" font-weight="700">No Poster</text>
      <text x="200" y="325" text-anchor="middle" font-family="Arial" font-size="18" fill="#607086">Available</text>
    </svg>
  `);
}


function getDownloadUrl(url) {
  const value = String(url || '').trim();
  const match = value.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return value || '#';
}

function copyLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link copied');
  }).catch(() => {
    showToast('Copy nahi hua. Link manually copy karo.');
  });
}

function showToast(message) {
  const oldToast = document.querySelector('.toast');
  if (oldToast) oldToast.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function renderMovieDownloads(movie) {
  const qualities = Array.isArray(movie.qualities) ? movie.qualities : [];
  if (!qualities.length) {
    return '<div class="error-box">Is movie ka download link abhi add nahi hai.</div>';
  }

  return `
    <section class="ott-panel">
      <div class="panel-heading">
        <h3>Available Qualities</h3>
        <p>Quality select karke Google Drive preview/download open karo.</p>
      </div>
      <div class="ott-download-grid">
        ${qualities.map((q) => `
          <div class="ott-download-card">
            <div>
              <strong>${escapeHtml(q.quality || 'Download')}</strong>
              <p>${escapeHtml(q.size || '')}</p>
            </div>
            <div class="download-actions">
              <a class="view-link" href="${escapeHtml(q.downloadUrl || '#')}" target="_blank" rel="noopener noreferrer">View</a>
              <a class="download-link" href="${escapeHtml(getDownloadUrl(q.downloadUrl))}" target="_blank" rel="noopener noreferrer">Download</a>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function getEpisodeLabel(episode) {
  const episodeName = episode.episode || 'Episode';
  const episodeTitle = episode.title || '';
  if (!episodeTitle || episodeTitle.trim().toLowerCase() === episodeName.trim().toLowerCase()) return episodeName;
  return `${episodeName} - ${episodeTitle}`;
}

function renderSeriesEpisodes(series) {
  const seasons = Array.isArray(series.seasons) ? series.seasons : [];
  if (!seasons.length) {
    return '<div class="error-box">Is web series ke episodes abhi add nahi hain.</div>';
  }

  return `
    <section class="ott-panel">
      <div class="panel-heading">
        <h3>Episodes</h3>
        <p>Season ke according episode choose karo.</p>
      </div>
      <div class="season-tabs">
        ${seasons.map((season, index) => `
          <button type="button" class="season-tab ${index === 0 ? 'active' : ''}" data-season-index="${index}">${escapeHtml(season.season || 'Season')}</button>
        `).join('')}
      </div>
      <div class="season-panels">
        ${seasons.map((season, seasonIndex) => `
          <div class="season-panel ${seasonIndex === 0 ? 'active' : ''}" data-season-panel="${seasonIndex}">
            ${(season.episodes || []).map((episode) => `
              <div class="ott-episode-row">
                <div class="episode-main">
                  <strong>${escapeHtml(getEpisodeLabel(episode))}</strong>
                  <p>${escapeHtml(episode.quality || '')}${episode.size ? ' • ' + escapeHtml(episode.size) : ''}</p>
                </div>
                <div class="download-actions">
                  <a class="view-link" href="${escapeHtml(episode.downloadUrl || '#')}" target="_blank" rel="noopener noreferrer">View</a>
                  <a class="download-link" href="${escapeHtml(getDownloadUrl(episode.downloadUrl))}" target="_blank" rel="noopener noreferrer">Download</a>
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderSimilarTitles(currentMovie, movies) {
  const similar = movies
    .filter((item) => item.id !== currentMovie.id)
    .filter((item) => item.category === currentMovie.category || item.type === currentMovie.type)
    .slice(0, 4);

  if (!similar.length) return '';

  return `
    <section class="similar-section">
      <h3>You may also like</h3>
      <div class="similar-grid">
        ${similar.map((item) => `
          <a class="similar-card" href="movie.html?id=${encodeURIComponent(item.id)}">
            <img src="${escapeHtml(getPoster(item))}" alt="${escapeHtml(item.title)}" onerror="imageFallback(this)" />
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(getItemType(item))} • ${escapeHtml(item.category || 'General')}</p>
            </div>
          </a>
        `).join('')}
      </div>
    </section>
  `;
}

function bindDetailActions() {
  document.querySelectorAll('[data-copy-url]').forEach((button) => {
    button.addEventListener('click', () => copyLink(button.getAttribute('data-copy-url')));
  });

  document.querySelectorAll('.season-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const index = tab.getAttribute('data-season-index');
      document.querySelectorAll('.season-tab').forEach((item) => item.classList.remove('active'));
      document.querySelectorAll('.season-panel').forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.querySelector(`[data-season-panel="${index}"]`);
      if (panel) panel.classList.add('active');
    });
  });
}

async function loadMovieDetail() {
  try {
    const response = await fetch('movies.json?v=' + Date.now());
    if (!response.ok) throw new Error('movies.json not found');
    const movies = await response.json();
    if (!Array.isArray(movies)) throw new Error('Invalid movies.json');

    const movie = movies.find((item) => item.id === getMovieId());
    if (!movie) {
      detailBox.innerHTML = '<div class="container"><div class="error-box">Movie not found.</div></div>';
      return;
    }

    document.title = movie.title;
    const poster = getPoster(movie);

    detailBox.innerHTML = `
      <section class="ott-hero" style="--hero-poster: url('${escapeHtml(poster)}')">
        <div class="ott-hero-bg"></div>
        <div class="ott-hero-inner">
          <div class="ott-poster-card">
            <img src="${escapeHtml(poster)}" alt="${escapeHtml(movie.title)}" onerror="imageFallback(this)" />
          </div>
          <div class="ott-info-card">
            <div class="badge-row premium-badges">
              <span>${escapeHtml(getItemType(movie))}</span>
              <span>${escapeHtml(movie.language || 'Hindi')}</span>
              <span>${escapeHtml(movie.category || 'General')}</span>
              <span>${escapeHtml(movie.year || '')}</span>
            </div>
            <h2>${escapeHtml(movie.title)}</h2>
            <p class="ott-description">${escapeHtml(movie.description || '')}</p>
            <div class="ott-stat-row">
              <div class="ott-stat"><strong>${escapeHtml(getQualityText(movie))}</strong><span>Available</span></div>
            </div>
            ${movie.trailerUrl ? `<div class="ott-action-row"><a class="trailer-btn" href="${escapeHtml(movie.trailerUrl)}" target="_blank" rel="noopener noreferrer">Watch Trailer</a></div>` : ''}
          </div>
        </div>
      </section>

      <section id="downloadSection" class="ott-content container">
        ${movie.type === 'series' ? renderSeriesEpisodes(movie) : renderMovieDownloads(movie)}
        ${renderSimilarTitles(movie, movies)}
      </section>
    `;

    bindDetailActions();
  } catch (error) {
    detailBox.innerHTML = '<div class="container"><div class="error-box">Movie details load nahi ho pa rahe. movies.json check karo.</div></div>';
  }
}

loadMovieDetail();

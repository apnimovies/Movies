const detailBox = document.getElementById('movieDetail');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getMovieId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function getItemType(item) {
  return item.type === 'series' ? 'Web Series' : 'Movie';
}

function showJsonError(error) {
  console.error('movie details error:', error);
  detailBox.innerHTML = `
    <div class="error-box json-error-box">
      <strong>Movie details load nahi ho pa rahe.</strong>
      <p>movies.json me comma, bracket, quote ya selected movie id check karo.</p>
      <code>python -m http.server 8000</code>
    </div>
  `;
}

function renderMovieQualities(movie) {
  const qualities = Array.isArray(movie.qualities) ? movie.qualities : [];
  if (!qualities.length) {
    return '<div class="error-box">Is movie ka download link abhi add nahi hai.</div>';
  }

  return `
    <h3>Download Quality</h3>
    <div class="quality-list">
      ${qualities.map((q) => `
        <a class="download-row" href="${escapeHtml(q.downloadUrl)}" target="_blank" rel="noopener noreferrer">
          <div>
            <strong>${escapeHtml(q.quality || 'Download')}</strong>
            <p>${escapeHtml(q.size || '')}</p>
          </div>
          <button>Download</button>
        </a>
      `).join('')}
    </div>
  `;
}

function getEpisodeLabel(episode) {
  const episodeName = episode.episode || 'Episode';
  const episodeTitle = episode.title || '';

  if (!episodeTitle || episodeTitle.trim().toLowerCase() === episodeName.trim().toLowerCase()) {
    return episodeName;
  }

  return episodeName + ' - ' + episodeTitle;
}

function renderSeriesEpisodes(series) {
  const seasons = Array.isArray(series.seasons) ? series.seasons : [];
  if (!seasons.length) {
    return '<div class="error-box">Is web series ke episodes abhi add nahi hain.</div>';
  }

  return `
    <h3>Episodes</h3>
    <div class="season-list">
      ${seasons.map((season) => `
        <div class="season-card">
          <div class="season-title">${escapeHtml(season.season || 'Season')}</div>
          <div class="episode-list">
            ${(season.episodes || []).map((episode) => `
              <a class="download-row episode-row" href="${escapeHtml(episode.downloadUrl)}" target="_blank" rel="noopener noreferrer">
                <div>
                  <strong>${escapeHtml(getEpisodeLabel(episode))}</strong>
                  <p>${escapeHtml(episode.quality || '')}${episode.size ? ' • ' + escapeHtml(episode.size) : ''}</p>
                </div>
                <button>Download</button>
              </a>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function attachDetailPosterFallback() {
  const image = document.querySelector('.detail-poster');
  if (!image) return;

  image.addEventListener('error', () => {
    const fallback = image.parentElement.querySelector('.poster-fallback');
    image.style.display = 'none';
    if (fallback) fallback.style.display = 'flex';
  }, { once: true });
}

async function loadMovieDetail() {
  try {
    const response = await fetch('movies.json?v=' + Date.now());
    if (!response.ok) {
      throw new Error('movies.json file not found or not accessible');
    }

    const movies = await response.json();
    if (!Array.isArray(movies)) {
      throw new Error('movies.json root must be an array []');
    }

    const movie = movies.find((item) => item.id === getMovieId());

    if (!movie) {
      detailBox.innerHTML = '<div class="error-box">Movie not found. movies.json me id check karo.</div>';
      return;
    }

    document.title = movie.title || 'Movie Details';
    detailBox.innerHTML = `
      <div class="detail-poster-wrap">
        <img class="detail-poster" src="${escapeHtml(movie.poster)}" alt="${escapeHtml(movie.title)}" />
        <div class="poster-fallback detail-fallback" style="display:none;">No Poster<br>Available</div>
      </div>
      <div class="detail-content">
        <div class="badge-row">
          <span>${escapeHtml(getItemType(movie))}</span>
          <span>${escapeHtml(movie.language || '')}</span>
          <span>${escapeHtml(movie.category || 'General')}</span>
          <span>${escapeHtml(movie.year || '')}</span>
        </div>
        <h2>${escapeHtml(movie.title || 'Untitled')}</h2>
        <p class="description">${escapeHtml(movie.description || '')}</p>
        ${movie.type === 'series' ? renderSeriesEpisodes(movie) : renderMovieQualities(movie)}
      </div>
    `;
    attachDetailPosterFallback();
  } catch (error) {
    showJsonError(error);
  }
}

loadMovieDetail();

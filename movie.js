const detailBox = document.getElementById('movieDetail');

function getMovieId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function getItemType(item) {
  return item.type === 'series' ? 'Web Series' : 'Movie';
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
        <a class="download-row" href="${q.downloadUrl}" target="_blank" rel="noopener noreferrer">
          <div>
            <strong>${q.quality || 'Download'}</strong>
            <p>${q.size || ''}</p>
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
          <div class="season-title">${season.season || 'Season'}</div>
          <div class="episode-list">
            ${(season.episodes || []).map((episode) => `
              <a class="download-row episode-row" href="${episode.downloadUrl}" target="_blank" rel="noopener noreferrer">
                <div>
                  <strong>${getEpisodeLabel(episode)}</strong>
                  <p>${episode.quality || ''}${episode.size ? ' • ' + episode.size : ''}</p>
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

async function loadMovieDetail() {
  try {
    const response = await fetch('movies.json?v=' + Date.now());
    const movies = await response.json();
    const movie = movies.find((item) => item.id === getMovieId());

    if (!movie) {
      detailBox.innerHTML = '<div class="error-box">Movie not found.</div>';
      return;
    }

    document.title = movie.title;
    detailBox.innerHTML = `
      <div class="detail-poster-wrap">
        <img class="detail-poster" src="${movie.poster}" alt="${movie.title}" />
      </div>
      <div class="detail-content">
        <div class="badge-row">
          <span>${getItemType(movie)}</span>
          <span>${movie.language || ''}</span>
          <span>${movie.category || 'General'}</span>
          <span>${movie.year || ''}</span>
        </div>
        <h2>${movie.title}</h2>
        <p class="description">${movie.description || ''}</p>
        ${movie.type === 'series' ? renderSeriesEpisodes(movie) : renderMovieQualities(movie)}
      </div>
    `;
  } catch (error) {
    detailBox.innerHTML = '<div class="error-box">Movie details load nahi ho pa rahe.</div>';
  }
}

loadMovieDetail();

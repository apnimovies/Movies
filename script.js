const movieGrid = document.getElementById('movieGrid');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
let allMovies = [];
const posterCacheVersion = Date.now();

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getPosterUrl(movie) {
  const poster = String(movie.poster || '').trim().replace(/\\/g, '/');
  if (!poster) return '';
  const separator = poster.includes('?') ? '&' : '?';
  const version = `${movie.posterVersion || 'poster'}-${posterCacheVersion}`;
  return `${encodeURI(poster)}${separator}v=${encodeURIComponent(version)}`;
}

function getMissingPoster(title) {
  const safeTitle = escapeHtml(title || 'Poster');
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900">
      <rect width="600" height="900" fill="#dfe8f7"/>
      <text x="300" y="420" text-anchor="middle" font-family="Arial" font-size="38" fill="#607086" font-weight="700">Poster Missing</text>
      <text x="300" y="475" text-anchor="middle" font-family="Arial" font-size="24" fill="#607086">${safeTitle}</text>
    </svg>
  `);
}

function handlePosterError(image, title) {
  image.onerror = null;
  image.src = getMissingPoster(title);
  image.classList.add('image-missing');
}

async function loadMovies() {
  try {
    const response = await fetch('movies.json?v=' + Date.now());
    allMovies = await response.json();
    renderMovies(allMovies);
  } catch (error) {
    movieGrid.innerHTML = '<div class="error-box">movies.json load nahi ho pa raha. Local test ke liye server command use karo.</div>';
  }
}

function getItemType(item) {
  return item.type === 'series' ? 'Web Series' : 'Movie';
}

function getItemSubText(item) {
  const parts = [];
  if (item.language) parts.push(item.language);
  if (item.year) parts.push(item.year);
  return parts.join(' • ');
}

function renderMovies(movies, query = '') {
  movieGrid.innerHTML = '';

  if (!movies.length) {
    emptyState.style.display = 'block';
    emptyState.innerHTML = query
      ? `No result found for <strong>${query}</strong>. Search spelling check karo ya dusra keyword try karo.`
      : 'No movies or web series found. movies.json me data add karo.';
  } else {
    emptyState.style.display = 'none';
    emptyState.innerHTML = '';
  }

  movies.forEach((movie) => {
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = `movie.html?id=${encodeURIComponent(movie.id)}`;

    const posterUrl = getPosterUrl(movie);

    card.innerHTML = `
      <div class="poster-wrap">
        <img src="${escapeHtml(posterUrl)}" alt="${escapeHtml(movie.title)}" loading="lazy" />
        <span class="type-badge">${escapeHtml(getItemType(movie))}</span>
      </div>
      <div class="movie-info">
        <h3>${escapeHtml(movie.title)}</h3>
        <p>${escapeHtml(getItemSubText(movie))}</p>
        <span>${escapeHtml(movie.category || getItemType(movie))}</span>
      </div>
    `;

    const posterImage = card.querySelector('img');
    posterImage.addEventListener('error', () => handlePosterError(posterImage, movie.title), { once: true });

    movieGrid.appendChild(card);
  });
}

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = allMovies.filter((movie) => {
    const seasonsText = (movie.seasons || [])
      .map((season) => `${season.season || ''} ${(season.episodes || []).map((ep) => `${ep.episode || ''} ${ep.title || ''}`).join(' ')}`)
      .join(' ');

    return `${movie.title || ''} ${movie.type || ''} ${movie.language || ''} ${movie.category || ''} ${movie.year || ''} ${seasonsText}`
      .toLowerCase()
      .includes(query);
  });
  renderMovies(filtered, query);
});

loadMovies();

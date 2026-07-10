const movieGrid = document.getElementById('movieGrid');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
let allMovies = [];

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showJsonError(error) {
  console.error('movies.json error:', error);
  movieGrid.innerHTML = `
    <div class="error-box json-error-box">
      <strong>Movies data load nahi ho pa raha.</strong>
      <p>movies.json me comma, bracket, quote ya link format check karo.</p>
      <p>Local test ke liye hamesha ye command use karo:</p>
      <code>python -m http.server 8000</code>
    </div>
  `;
  emptyState.style.display = 'none';
}

async function loadMovies() {
  try {
    const response = await fetch('movies.json?v=' + Date.now());
    if (!response.ok) {
      throw new Error('movies.json file not found or not accessible');
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('movies.json root must be an array []');
    }

    allMovies = data;
    renderMovies(allMovies);
  } catch (error) {
    showJsonError(error);
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

function attachPosterFallbacks() {
  document.querySelectorAll('.poster-image').forEach((image) => {
    image.addEventListener('error', () => {
      const fallback = image.parentElement.querySelector('.poster-fallback');
      image.style.display = 'none';
      if (fallback) fallback.style.display = 'flex';
    }, { once: true });
  });
}

function renderMovies(movies) {
  movieGrid.innerHTML = '';
  emptyState.style.display = movies.length ? 'none' : 'block';

  movies.forEach((movie) => {
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = `movie.html?id=${encodeURIComponent(movie.id || '')}`;

    card.innerHTML = `
      <div class="poster-wrap">
        <img class="poster-image" src="${escapeHtml(movie.poster)}" alt="${escapeHtml(movie.title)}" />
        <div class="poster-fallback" style="display:none;">No Poster<br>Available</div>
        <span class="type-badge">${escapeHtml(getItemType(movie))}</span>
      </div>
      <div class="movie-info">
        <h3>${escapeHtml(movie.title || 'Untitled')}</h3>
        <p>${escapeHtml(getItemSubText(movie))}</p>
        <span>${escapeHtml(movie.category || getItemType(movie))}</span>
      </div>
    `;

    movieGrid.appendChild(card);
  });

  attachPosterFallbacks();
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
  renderMovies(filtered);
});

loadMovies();

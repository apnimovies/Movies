const movieGrid = document.getElementById('movieGrid');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
let allMovies = [];

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

    card.innerHTML = `
      <div class="poster-wrap">
        <img src="${movie.poster}" alt="${movie.title}" />
        <span class="type-badge">${getItemType(movie)}</span>
      </div>
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <p>${getItemSubText(movie)}</p>
        <span>${movie.category || getItemType(movie)}</span>
      </div>
    `;

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

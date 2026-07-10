const movieGrid = document.getElementById('movieGrid');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
let allMovies = [];

async function loadMovies() {
  try {
    const response = await fetch('movies.json?v=2');
    allMovies = await response.json();
    renderMovies(allMovies);
  } catch (error) {
    movieGrid.innerHTML = '<div class="error-box">movies.json load nahi ho pa raha. Local test ke liye server command use karo.</div>';
  }
}

function renderMovies(movies) {
  movieGrid.innerHTML = '';
  emptyState.style.display = movies.length ? 'none' : 'block';

  movies.forEach((movie) => {
    const card = document.createElement('a');
    card.className = 'movie-card';
    card.href = `movie.html?id=${encodeURIComponent(movie.id)}`;

    card.innerHTML = `
      <img src="${movie.poster}" alt="${movie.title}" />
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <p>${movie.language || ''} ${movie.year ? '• ' + movie.year : ''}</p>
        <span>${movie.category || 'Movie'}</span>
      </div>
    `;

    movieGrid.appendChild(card);
  });
}

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = allMovies.filter((movie) => {
    return `${movie.title} ${movie.language} ${movie.category} ${movie.year}`.toLowerCase().includes(query);
  });
  renderMovies(filtered);
});

loadMovies();

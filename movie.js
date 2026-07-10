const detailBox = document.getElementById('movieDetail');

function getMovieId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadMovieDetail() {
  try {
    const response = await fetch('movies.json?v=2');
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
          <span>${movie.language || 'Movie'}</span>
          <span>${movie.category || 'General'}</span>
          <span>${movie.year || ''}</span>
        </div>
        <h2>${movie.title}</h2>
        <p class="description">${movie.description || ''}</p>
        <h3>Download Quality</h3>
        <div class="quality-list">
          ${movie.qualities.map((q) => `
            <a class="download-row" href="${q.downloadUrl}" target="_blank" rel="noopener noreferrer">
              <div>
                <strong>${q.quality}</strong>
                <p>${q.size || ''}</p>
              </div>
              <button>Download</button>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    detailBox.innerHTML = '<div class="error-box">Movie details load nahi ho pa rahe.</div>';
  }
}

loadMovieDetail();

const currentJsonEl = document.getElementById('currentJson');
const outputJsonEl = document.getElementById('outputJson');
const jsonStatus = document.getElementById('jsonStatus');
const outputStatus = document.getElementById('outputStatus');
const itemTypeEl = document.getElementById('itemType');
const movieFields = document.getElementById('movieFields');
const seriesFields = document.getElementById('seriesFields');

function setStatus(element, message, type = 'info') {
  element.textContent = message;
  element.className = `admin-status ${type}`;
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseJsonFromTextarea() {
  const raw = currentJsonEl.value.trim();
  if (!raw) return [];

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('movies.json ka root [] array hona chahiye.');
  }
  return parsed;
}

async function loadCurrentJson() {
  try {
    const response = await fetch('movies.json?v=' + Date.now());
    if (!response.ok) throw new Error('movies.json file nahi mili.');
    const data = await response.json();
    currentJsonEl.value = JSON.stringify(data, null, 2);
    setStatus(jsonStatus, 'Current movies.json load ho gaya.', 'success');
  } catch (error) {
    setStatus(jsonStatus, 'Auto load nahi hua. Aap current movies.json manually paste karo.', 'error');
  }
}

function parsePipeLines(value, expectedParts, lineName) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split('|').map((part) => part.trim());
      if (parts.length < expectedParts) {
        throw new Error(`${lineName} line ${index + 1} ka format galat hai.`);
      }
      return parts;
    });
}

function buildMovieItem() {
  const type = itemTypeEl.value;
  const title = document.getElementById('title').value.trim();
  const id = document.getElementById('itemId').value.trim() || slugify(title);
  const language = document.getElementById('language').value.trim();
  const category = document.getElementById('category').value.trim();
  const year = document.getElementById('year').value.trim();
  const poster = document.getElementById('poster').value.trim();
  const description = document.getElementById('description').value.trim();

  if (!title) throw new Error('Title required hai.');
  if (!id) throw new Error('ID required hai.');
  if (!poster) throw new Error('Poster path required hai.');

  const item = { id, title, type, language, category, year, poster, description };

  if (type === 'series') {
    const seasonName = document.getElementById('seasonName').value.trim() || 'Season 1';
    const episodeLines = parsePipeLines(document.getElementById('episodesText').value, 5, 'Episode');
    if (!episodeLines.length) throw new Error('Series ke liye kam se kam 1 episode add karo.');

    item.seasons = [
      {
        season: seasonName,
        episodes: episodeLines.map((parts) => ({
          episode: parts[0],
          title: parts[1],
          quality: parts[2],
          size: parts[3],
          downloadUrl: parts.slice(4).join('|')
        }))
      }
    ];
  } else {
    const qualityLines = parsePipeLines(document.getElementById('qualitiesText').value, 3, 'Quality');
    if (!qualityLines.length) throw new Error('Movie ke liye kam se kam 1 quality add karo.');

    item.qualities = qualityLines.map((parts) => ({
      quality: parts[0],
      size: parts[1],
      downloadUrl: parts.slice(2).join('|')
    }));
  }

  return item;
}

function generateFullJson() {
  try {
    const movies = parseJsonFromTextarea();
    const newItem = buildMovieItem();
    const replaceSameId = document.getElementById('replaceSameId').checked;
    const existingIndex = movies.findIndex((item) => item.id === newItem.id);

    if (existingIndex >= 0 && replaceSameId) {
      movies[existingIndex] = newItem;
      setStatus(outputStatus, `Old ID '${newItem.id}' replace karke full JSON bana diya.`, 'success');
    } else if (existingIndex >= 0 && !replaceSameId) {
      throw new Error('Same ID already exist hai. Replace checkbox ON karo ya ID change karo.');
    } else {
      movies.push(newItem);
      setStatus(outputStatus, 'New item add karke full JSON bana diya.', 'success');
    }

    const finalJson = JSON.stringify(movies, null, 2);
    outputJsonEl.value = finalJson;
    currentJsonEl.value = finalJson;
  } catch (error) {
    setStatus(outputStatus, error.message, 'error');
  }
}

function formatCurrentJson() {
  try {
    const movies = parseJsonFromTextarea();
    currentJsonEl.value = JSON.stringify(movies, null, 2);
    setStatus(jsonStatus, 'JSON format ho gaya.', 'success');
  } catch (error) {
    setStatus(jsonStatus, error.message, 'error');
  }
}

async function copyOutput() {
  try {
    await navigator.clipboard.writeText(outputJsonEl.value);
    setStatus(outputStatus, 'JSON copy ho gaya.', 'success');
  } catch (error) {
    setStatus(outputStatus, 'Copy nahi hua. Output manually select karke copy karo.', 'error');
  }
}

function downloadJson() {
  if (!outputJsonEl.value.trim()) {
    setStatus(outputStatus, 'Pehle Generate Full JSON karo.', 'error');
    return;
  }

  const blob = new Blob([outputJsonEl.value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'movies.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(outputStatus, 'movies.json download ho gaya. Is file ko project folder me replace karo.', 'success');
}

function clearForm() {
  ['itemId', 'title', 'category', 'poster', 'description', 'qualitiesText', 'episodesText'].forEach((id) => {
    document.getElementById(id).value = '';
  });
  document.getElementById('language').value = 'Hindi';
  document.getElementById('year').value = '2026';
  document.getElementById('seasonName').value = 'Season 1';
  setStatus(outputStatus, 'Form clear ho gaya.', 'info');
}

itemTypeEl.addEventListener('change', () => {
  const isSeries = itemTypeEl.value === 'series';
  movieFields.style.display = isSeries ? 'none' : 'block';
  seriesFields.style.display = isSeries ? 'block' : 'none';
});

document.getElementById('title').addEventListener('input', (event) => {
  const idField = document.getElementById('itemId');
  if (!idField.value.trim()) {
    idField.value = slugify(event.target.value);
  }
});

document.getElementById('loadJsonBtn').addEventListener('click', loadCurrentJson);
document.getElementById('formatJsonBtn').addEventListener('click', formatCurrentJson);
document.getElementById('generateBtn').addEventListener('click', generateFullJson);
document.getElementById('clearFormBtn').addEventListener('click', clearForm);
document.getElementById('copyBtn').addEventListener('click', copyOutput);
document.getElementById('downloadBtn').addEventListener('click', downloadJson);

loadCurrentJson();

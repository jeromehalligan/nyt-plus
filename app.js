// --- CONFIGURATION ---
// Try to grab the key from the browser's hidden storage first
let NYT_API_KEY = localStorage.getItem('nyt_key');

// If it's not there, pop up a box asking you to paste it in
if (!NYT_API_KEY) {
  NYT_API_KEY = prompt("Please enter your New York Times API Key:");
  if (NYT_API_KEY) {
    localStorage.setItem('nyt_key', NYT_API_KEY); // Saves it securely in your browser forever
  }
}

const SECTION = 'home';
const API_URL = `https://api.nytimes.com/svc/topstories/v2/${SECTION}.json?api-key=${NYT_API_KEY}`;

// --- DOM ELEMENTS ---
const feedGrid = document.getElementById('feed-grid');
const currentDateEl = document.getElementById('current-date');

// --- FORMAT DATE FOR THE HEADER ---
function updateDashboardDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date();
  currentDateEl.innerText = today.toLocaleDateString('en-US', options).toUpperCase();
}

// --- FETCH AND RENDER ENGINE ---
async function fetchTopStories() {
  try {
    // 1. Clear out the placeholder card from our HTML
    feedGrid.innerHTML = '<div class="status-pill" style="text-align:center; padding:20px;">Fetching latest stories...</div>';
    
    // 2. Request data from NYT
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 3. Wipe the loading state
    feedGrid.innerHTML = '';
    
    // 4. Loop through the articles array (filtering out any weird layout items missing URLs)
    const articles = data.results.filter(story => story.url && story.title);
    
    articles.forEach(story => {
      // THE MAGIC TRICK: Append the flag so your Chrome extension auto-triggers
      const automaticReaderUrl = `${story.url}?reader=true`;

      // Check if multimedia exists and grab the standard or large image URL
      let imageUrl = '';
      if (story.multimedia && story.multimedia.length > 0) {
        // Look for the high-res desktop version first
        const highResImage = story.multimedia.find(media => media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X');
        
        // If we find it, use it! Otherwise, fall back to whatever first image is available.
        imageUrl = highResImage ? highResImage.url : story.multimedia[0].url; 
      }
      
      // Clean up the author string (removes "By " if present, handles missing authors)
      const cleanAuthor = story.byline ? story.byline.toUpperCase() : 'STAFF WRITER';
      const cleanSection = story.section ? story.section.toUpperCase() : 'GENERAL';
      
      // Create the article card element
      const articleCard = document.createElement('article');
      articleCard.className = 'story-card';
      
      // Build the interior minimalist DOM string
      articleCard.innerHTML = `
        <a href="${automaticReaderUrl}" class="story-link">
          ${imageUrl ? `<div class="story-image-wrapper"><img src="${imageUrl}" alt="" class="story-img"></div>` : ''}
          <h2 class="story-title">${story.title}</h2>
          <p class="story-abstract">${story.abstract || 'No abstract preview available for this story.'}</p>
          <div class="story-meta">
            <span class="story-author">${cleanAuthor}</span>
            <span class="story-divider">•</span>
            <span class="story-section">${cleanSection}</span>
          </div>
        </a>
      `;
      
      // Inject the newly minted card into the dashboard feed grid
      feedGrid.appendChild(articleCard);
    });

  } catch (error) {
    console.error('Error fetching NYT Top Stories:', error);
    feedGrid.innerHTML = `
      <div class="status-pill" style="background-color: #ffdddd; color: #cc0000; padding: 20px; text-align: center;">
        Failed to load feed. Check console or verify your API Key configuration.
      </div>
    `;
  }
}

// --- INITIALIZE THE DASHBOARD ---
updateDashboardDate();
fetchTopStories();

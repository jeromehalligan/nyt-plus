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
    const articles = data.results.filter(story => story.url && story.title).slice(0, 12);

    // --- CREATE FOUR DISCRETE COLUMNS ---
    let col1Html = '';
    let col2Html = '';
    let col3Html = '';
    let col4Html = '';
    
    articles.forEach((story, index) => {
      const automaticReaderUrl = `${story.url}?reader=true`;

      // 5. PROCESS THE RELATED UNDER-BULLETS IF THEY EXIST
      let relatedLinksHtml = '';
      if (story.related_urls && story.related_urls.length > 0) {
        relatedLinksHtml = story.related_urls.map(related => `
          <li class="related-item">
            <a href="${related.url}" target="_blank" class="related-link">
              ${related.title}
            </a>
          </li>
        `).join('');
      }

      // 6. EXTRACT PERFECT HIGH-RES IMAGE 
      let imageUrl = '';
      if (story.multimedia && story.multimedia.length > 0) {
        const highResImage = story.multimedia.find(media => media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X');
        imageUrl = highResImage ? highResImage.url : story.multimedia[0].url; 
      }
      
      const cleanAuthor = story.byline ? story.byline.toUpperCase() : 'STAFF WRITER';
      
      // 7. BUILD THE DYNAMIC HTML BROADSHEET CARD CARD
      // FIXED: Swapped raw array link for the optimized imageUrl variable
      const cardHtml = `
        <article class="story-card">
          <a href="${automaticReaderUrl}" class="story-link">
            ${imageUrl ? `<div class="story-image-wrapper"><img src="${imageUrl}" alt="" class="story-img"></div>` : ''}
            <h2 class="story-title">${story.title}</h2>
            <p class="story-abstract">${story.abstract || ''}</p>
          </a>
          
          ${relatedLinksHtml ? `<ul class="story-related-list">${relatedLinksHtml}</ul>` : ''}
          
          <div class="story-meta">
            <span class="story-author">${cleanAuthor}</span>
          </div>
        </article>
      `;

      // 8. THE COG IN THE MACHINE: Distribute articles systematically by index
      if (index === 0) {
        col1Html += cardHtml; // 1st story goes into Lead Column
      } else if (index === 1 || index === 2) {
        col2Html += cardHtml; // 2nd and 3rd go into Secondary Column
      } else if (index === 3 || index === 4) {
        col3Html += cardHtml; // 4th and 5th go into Third Column 
      } else {
        col4Html += cardHtml; // 6th through 12th go into the Headline Column
      }
    });

    // Inject the isolated column pillars into the main layout hub
    feedGrid.innerHTML = `
      <div class="grid-column col-primary">${col1Html}</div>
      <div class="grid-column col-secondary">${col2Html}</div>
      <div class="grid-column col-thirdly">${col3Html}</div>
      <div class="grid-column col-headlines">${col4Html}</div>
    `;

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

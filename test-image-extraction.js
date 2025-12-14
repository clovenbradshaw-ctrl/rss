const { JSDOM } = require('jsdom');

// Simulate the getItunesImage function exactly as in the code
const getItunesImage = (parent) => {
  const itunesNS = 'http://www.itunes.com/dtds/podcast-1.0.dtd';

  // Try getElementsByTagNameNS with iTunes namespace
  try {
    let elements = parent.getElementsByTagNameNS(itunesNS, 'image');
    console.log('  Method 1 (NS):', elements.length, 'elements');
    if (elements.length > 0) {
      const href = elements[0].getAttribute('href');
      if (href) return { method: 'getElementsByTagNameNS(itunesNS)', href };
    }
  } catch(e) { console.log('  Method 1 error:', e.message); }

  // Try itunes:image with colon
  try {
    let elements = parent.getElementsByTagName('itunes:image');
    console.log('  Method 2 (colon):', elements.length, 'elements');
    if (elements.length > 0) {
      const href = elements[0].getAttribute('href');
      if (href) return { method: 'getElementsByTagName(itunes:image)', href };
    }
  } catch(e) { console.log('  Method 2 error:', e.message); }

  // Try wildcard namespace
  try {
    const elements = parent.getElementsByTagNameNS('*', 'image');
    console.log('  Method 3 (wildcard NS):', elements.length, 'elements');
    for (let i = 0; i < elements.length; i++) {
      const href = elements[i].getAttribute('href');
      if (href) return { method: 'getElementsByTagNameNS(*)', href };
    }
  } catch(e) { console.log('  Method 3 error:', e.message); }

  // Try just 'image' elements
  const imageEls = parent.getElementsByTagName('image');
  console.log('  Method 4 (plain image):', imageEls.length, 'elements');
  for (let i = 0; i < imageEls.length; i++) {
    const href = imageEls[i].getAttribute('href');
    if (href) return { method: 'getElementsByTagName(image)', href };
  }

  // NEW FALLBACK: Find elements with tagName containing 'image'
  try {
    const allElements = parent.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      const tagName = el.tagName.toLowerCase();
      if (tagName.includes('image') || tagName === 'logo' || tagName === 'icon') {
        const href = el.getAttribute('href');
        console.log('  Method 5 found:', tagName, '-> href:', href ? 'YES' : 'NO');
        if (href) return { method: 'tagName.includes(image)', href };
      }
    }
  } catch(e) { console.log('  Method 5 error:', e.message); }

  // LAST RESORT: Find first href that looks like an image URL
  try {
    const allElements = parent.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const href = allElements[i].getAttribute('href');
      if (href && /\.(jpg|jpeg|png|gif|webp)/i.test(href)) {
        return { method: 'href ends with image ext', href };
      }
    }
  } catch(e) { console.log('  Method 6 error:', e.message); }

  return { method: 'NONE - NO IMAGE FOUND', href: '' };
};

// Sample Patreon-style RSS feed
const sampleFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title>Blank Check: Special Features</title>
    <itunes:image href="https://c10.patreonusercontent.com/4/show-artwork.jpg"/>
    <item>
      <title>Episode 1</title>
      <itunes:image href="https://c10.patreonusercontent.com/4/episode1.jpg"/>
      <enclosure url="https://audio.mp3" type="audio/mpeg"/>
    </item>
    <item>
      <title>Episode 2 - No episode image</title>
      <enclosure url="https://audio2.mp3" type="audio/mpeg"/>
    </item>
  </channel>
</rss>`;

const dom = new JSDOM(sampleFeed, { contentType: 'text/xml' });
const doc = dom.window.document;

console.log('=== Testing Channel Image ===');
const channel = doc.querySelector('channel');
const channelResult = getItunesImage(channel);
console.log('RESULT:', channelResult);

console.log('\n=== Testing Item 1 Image (has itunes:image) ===');
const items = doc.querySelectorAll('item');
const item1Result = getItunesImage(items[0]);
console.log('RESULT:', item1Result);

console.log('\n=== Testing Item 2 Image (no itunes:image, should fallback to channel) ===');
const item2Result = getItunesImage(items[1]);
console.log('RESULT:', item2Result);

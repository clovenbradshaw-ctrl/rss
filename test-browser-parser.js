const { JSDOM } = require('jsdom');

// Test using DOMParser like the browser does
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
  </channel>
</rss>`;

// Simulate browser's DOMParser
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const DOMParser = dom.window.DOMParser;
const parser = new DOMParser();
const doc = parser.parseFromString(sampleFeed, 'text/xml');

const channel = doc.querySelector('channel');
const item = doc.querySelector('item');

console.log('=== Raw Element Inspection ===');
console.log('Channel children:');
for (let i = 0; i < channel.children.length; i++) {
  const child = channel.children[i];
  console.log(' ', i, ':', child.tagName, '| localName:', child.localName, '| href:', child.getAttribute('href'));
}

console.log('\nItem children:');
for (let i = 0; i < item.children.length; i++) {
  const child = item.children[i];
  console.log(' ', i, ':', child.tagName, '| localName:', child.localName, '| href:', child.getAttribute('href'));
}

console.log('\n=== Testing getElementsByTagName variations ===');
const itunesNS = 'http://www.itunes.com/dtds/podcast-1.0.dtd';

console.log('getElementsByTagNameNS(itunesNS, "image"):', item.getElementsByTagNameNS(itunesNS, 'image').length);
console.log('getElementsByTagName("itunes:image"):', item.getElementsByTagName('itunes:image').length);
console.log('getElementsByTagNameNS("*", "image"):', item.getElementsByTagNameNS('*', 'image').length);
console.log('getElementsByTagName("image"):', item.getElementsByTagName('image').length);

// Check what querySelectorAll finds
console.log('\n=== querySelector tests ===');
try {
  console.log('querySelector("[href]"):', item.querySelector('[href]')?.tagName);
} catch(e) {
  console.log('querySelector("[href]") error:', e.message);
}

// What does getElementsByTagName('*') show?
console.log('\n=== All elements in item ===');
const allInItem = item.getElementsByTagName('*');
for (let i = 0; i < allInItem.length; i++) {
  const el = allInItem[i];
  console.log(' ', el.tagName, '| href:', el.getAttribute('href'));
}

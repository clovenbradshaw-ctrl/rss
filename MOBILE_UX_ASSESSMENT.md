# BRRST Mobile UX Assessment Report

**Date:** December 15, 2025
**Assessed Version:** Current main branch

---

## Executive Summary

The BRRST app provides a functional RSS reader for podcasts and news with solid core features (mini-player, sleep timer, playback speed, bookmarks). However, the mobile experience has significant UX gaps compared to native podcast apps like Spotify. Key areas needing improvement include feature discoverability, navigation patterns, and empty state handling.

---

## Issues Identified

### 1. Critical Navigation Hidden Behind Drawer

**Location:** `index.html:1349-1367` (drawer styles), `index.html:1523-1524` (sidebar hiding)

**Problem:**
On screens ≤768px, the sidebars containing podcast shows and news sources are completely hidden (`display: none !important`). Users must discover the hamburger menu (☰) to access:
- Feed management (add/remove shows)
- Podcast discovery
- Source selection
- For Later list

**Code Evidence:**
```css
@media (max-width: 768px) {
  .news-sidebar { display: none !important; }
  .podcast-sidebar { display: none !important; }
}
```

**Impact:** Users may not realize they can subscribe to multiple shows or manage their feeds.

**Spotify Comparison:** Spotify uses a persistent bottom tab bar with "Home", "Search", and "Your Library" - core features are always one tap away.

---

### 2. Manual RSS URL Entry Required

**Location:** `index.html:3839` (Add button), `index.html:6927-6999` (PodcastIndex API)

**Problem:**
The primary method to add podcasts is via RSS URL input. While there IS a podcast discovery feature (PodcastIndex search at line 6927), it's hidden behind a small magnifying glass icon in the drawer sidebar:

```html
<button class="add-btn discover-btn" id="discoverPodcastBtn" title="Discover Podcasts">
  <i class="ph ph-magnifying-glass"></i>
</button>
```

**Impact:** Users unfamiliar with RSS feeds have no obvious way to discover and subscribe to shows.

**Spotify Comparison:** Spotify prominently features podcast discovery with curated categories, trending shows, and personalized recommendations on the home screen.

---

### 3. News Articles Open in External Tabs

**Location:** `index.html:6573` (state default), `index.html:6650` (openArticleLink function)

**Problem:**
Articles always open in new browser tabs by default:
```javascript
openLinksInNewTab: true,
// ...
const openArticleLink = url => {
  if (url) state.openLinksInNewTab
    ? window.open(url, '_blank')
    : window.location.href = url;
};
```

**Impact:** Users lose context and must navigate back to the app manually.

**Spotify Comparison:** Spotify shows podcast episode descriptions and transcripts inline, keeping users in the app.

---

### 4. "For Later" Empty State Bug

**Location:** `index.html:9555-9625` (renderForLater function)

**Problem:**
The code properly handles empty state with a message:
```javascript
if (!state.forLater || state.forLater.length === 0) {
  el.forLaterList.innerHTML = `
    <div class="for-later-empty">
      <div class="for-later-empty-icon"><i class="ph ph-clock"></i></div>
      <div class="for-later-empty-title">No items saved for later</div>
      <div class="for-later-empty-desc">Click the clock icon...</div>
    </div>`;
}
```

However, the reported issue of "blank tabs" when accessing For Later suggests there may be a view switching bug. The For Later view toggle at line 3797:
```html
<button class="toggle-btn" data-view="forLater">
```

May not be properly setting `state.view = 'forLater'` on mobile, causing the view to not render.

**Root Cause Hypothesis:** The toggle buttons may not trigger properly on touch devices, or there's a timing issue with view rendering.

---

### 5. No Cross-Device Sync / Account System

**Location:** `index.html:6683-6712` (save function), `index.html:4843-4857` (StateSync)

**Problem:**
While there IS a StateSync mechanism to Xano backend, it only syncs:
- Feed subscriptions
- Playback progress
- Bookmarks
- Feed last viewed timestamps

It does NOT sync:
- User accounts/authentication
- For Later lists
- User preferences
- Full listening history

```javascript
const syncData = {
  feeds: state.feeds.map(f => ({...})),
  progress: state.progress,
  bookmarks: state.bookmarks,
  feedLastViewed: state.feedLastViewed
};
```

**Impact:** Users cannot seamlessly switch devices without losing some data.

---

### 6. Missing Queue Functionality

**Problem:** There is no episode queue system. Users can only play one episode at a time.

**Spotify Comparison:** Spotify has a robust queue system with "Play Next", "Add to Queue", and automatic playback of next episode.

---

### 7. No Transcript Support

**Problem:** No transcript viewing or search functionality exists in the codebase.

**Spotify Comparison:** Spotify shows auto-generated transcripts with timestamp navigation.

---

### 8. Limited Accessibility Features

**Location:** `index.html:5` (viewport meta)

**Problem:**
The viewport meta disables user scaling:
```html
<meta name="viewport" content="..., maximum-scale=1.0, user-scalable=no, ...">
```

This prevents users with visual impairments from zooming.

**Additional Missing Features:**
- No skip silence option
- No variable speed below 0.5x or above 3x
- No high contrast mode
- No screen reader announcements for player state changes

---

## Recommendations

### High Priority (Quick Wins)

1. **Add persistent mobile tab bar** - Replace drawer-only navigation with bottom tabs
2. **Make podcast discovery prominent** - Add "Discover" as a main navigation item
3. **Fix For Later view switching** - Debug touch event handling for view toggles
4. **Enable user zooming** - Remove `user-scalable=no` from viewport meta

### Medium Priority (Feature Enhancements)

5. **Add episode queue** - Implement "Play Next" and "Add to Queue" actions
6. **In-app article reader** - Show article content inline instead of opening external tabs
7. **Empty state feedback** - Add haptic/visual feedback when For Later is empty but accessed

### Lower Priority (Future Considerations)

8. **User accounts** - Add authentication for full cross-device sync
9. **Transcript integration** - Integrate with transcript APIs (Whisper, etc.)
10. **Accessibility overhaul** - Add screen reader support, high contrast mode, more speed options

---

## Code Locations Reference

| Issue | Primary Files/Lines |
|-------|-------------------|
| Drawer navigation | `index.html:1349-1367` |
| Sidebar hiding | `index.html:1523-1524` |
| Podcast discovery | `index.html:6927-6999` |
| Article links | `index.html:6650` |
| For Later render | `index.html:9555-9625` |
| State sync | `index.html:4843-4857` |
| Viewport meta | `index.html:5` |

---

## Conclusion

BRRST has a solid technical foundation with good offline support and a clean dark theme. The core podcast playback experience (player, speed, bookmarks, sleep timer) is well-implemented. However, the mobile UX significantly trails Spotify's podcast experience in discoverability, navigation intuitiveness, and feature richness. Addressing the navigation pattern (persistent bottom tabs) and making discovery prominent would have the biggest impact on user experience.

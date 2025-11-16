# Print Feature - Quick Reference

## Status: ✅ Ready for Implementation

## Phase 1 - Basic Print to PDF (Current)
**Goal**: Add print button that opens browser print dialog for PDF export

### What to Build:
1. ✅ Add print button next to Share button on Event Detail page
2. ✅ Add print button on Payments page
3. ✅ Button triggers `window.print()` - browser handles the rest
4. ✅ Print output includes entire page as-is (no optimizations yet)

### Files to Modify:
- `public/index.html` - Add print buttons
- `public/js/pages/event-detail.js` - Add click handler
- `public/js/pages/payments.js` - Add click handler
- `public/css/main.css` or `components.css` - Style print button

### Button Location:
```html
<!-- Event Detail Page -->
<div class="event-actions">
  <button id="share-event-btn" class="btn btn-outline btn-sm">🔗 Share</button>
  <button id="print-event-btn" class="btn btn-outline btn-sm">🖨️ Print</button>  <!-- NEW -->
  <button id="edit-event-btn" class="btn btn-outline btn-sm">✏️ Edit Event</button>
</div>
```

### Implementation:
```javascript
// event-detail.js
bindEventListeners() {
  // ... existing code ...
  
  const printBtn = document.getElementById('print-event-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }
}
```

### Testing:
- [ ] Print button visible and properly styled
- [ ] Click opens browser print dialog
- [ ] Can print to PDF successfully
- [ ] Works in Chrome, Firefox, Edge

**Effort**: 1-2 hours

---

## Phase 2 - Compact Print Layout (Next Priority) 🎯
**Goal**: Optimize print layout for compact, professional PDF output

### Issues from Phase 1 Testing:
1. **Excessive white space**: Event details takes full page
2. **Participant cards too large**: 6 participants takes full page
3. **Poor space utilization**: Content too spread out

### What to Build:
1. Create `print.css` with compact layout optimizations
2. **Event details + stats**: Target ≤50% of page (~5-6 inches)
3. **Participants section**: Target ≤50% of page (~3 inches for 6 participants)
   - Use 2-3 column grid layout
   - Reduce card padding and font sizes
4. Hide all UI chrome (sidebar, buttons, navigation)
5. Tighter spacing throughout

### Key CSS Changes:
```css
@media print {
  /* Compact layout */
  body { padding: 10mm; font-size: 10pt; line-height: 1.3; }

  /* Participants in 3-column grid */
  #event-participants-list {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  /* Compact cards */
  .participant-card { padding: 6px 8px; font-size: 9pt; }
  .event-info-card { padding: 8px 12px; }

  /* Hide UI chrome */
  .sidebar, .page-header, .btn, button { display: none !important; }
}
```

### Testing Checklist:
- [ ] Event details + stats fits in ≤4 inches
- [ ] 6 participants fit in ≤3.5 inches
- [ ] All content readable at smaller sizes
- [ ] PDF output professional quality

**Effort**: 2-4 hours

---

See `feature-print-functionality.md` for complete details.

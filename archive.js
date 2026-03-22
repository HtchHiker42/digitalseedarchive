/* ── LARK ARCHIVE — archive.js ───────────────────────────
   Handles the browse/archive page:
   - Search + filter
   - Renders submission cards
   - Data source: replace with your actual backend API when ready
     (Formspree submissions → Airtable, Supabase, or Google Sheets)
────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ── DATA SOURCE ───────────────────────────────────────
     Replace this with a fetch() call to your backend once ready.
     Example with Airtable:
       fetch('https://api.airtable.com/v0/YOUR_BASE/Submissions', {
         headers: { 'Authorization': 'Bearer YOUR_KEY' }
       }).then(r => r.json()).then(d => renderCards(d.records));

     For now, this is an empty array — the empty state will show.
     Add real entries here for testing:
       { lang: 'Navajo', iso: 'nav', vitality: 'Definitely Endangered',
         type: 'SEP', date: '2025-03-14', detail: 'Story elicitation session...' }
  ────────────────────────────────────────────────────── */
  var submissions = [
    /* ← Add approved public entries here, or fetch from your backend */
  ];

  var filtered = submissions.slice();

  document.addEventListener('DOMContentLoaded', function () {
    renderGrid(filtered);

    var searchInput   = document.getElementById('archive-search');
    var vitalityFilter = document.getElementById('vitality-filter');
    var typeFilter    = document.getElementById('type-filter');

    if (searchInput)    searchInput.addEventListener('input', applyFilters);
    if (vitalityFilter) vitalityFilter.addEventListener('change', applyFilters);
    if (typeFilter)     typeFilter.addEventListener('change', applyFilters);
  });

  function applyFilters () {
    var query    = (document.getElementById('archive-search').value || '').toLowerCase();
    var vitality = document.getElementById('vitality-filter').value;
    var type     = document.getElementById('type-filter').value;

    filtered = submissions.filter(function (s) {
      var matchSearch = !query ||
        s.lang.toLowerCase().includes(query) ||
        s.iso.toLowerCase().includes(query) ||
        (s.submitter || '').toLowerCase().includes(query);

      var matchVitality = !vitality || s.vitality === vitality;
      var matchType     = !type     || s.type === type;

      return matchSearch && matchVitality && matchType;
    });

    renderGrid(filtered);
  }

  function renderGrid (data) {
    var grid  = document.getElementById('archive-grid');
    var empty = document.getElementById('empty-state');
    if (!grid) return;

    grid.innerHTML = '';

    if (data.length === 0) {
      if (empty) empty.style.display = 'block';
      return;
    }

    if (empty) empty.style.display = 'none';

    data.forEach(function (s) {
      var card = document.createElement('div');
      card.className = 'archive-card';

      var vClass = '';
      if (s.vitality === 'Critically Endangered') vClass = 'critical';
      else if (s.vitality === 'Severely Endangered') vClass = 'severe';

      card.innerHTML =
        '<div class="archive-card-lang">' + escHtml(s.lang) + '</div>' +
        '<div class="archive-card-meta">' +
          '<span class="iso-badge">' + escHtml(s.iso) + '</span>' +
          (s.vitality ? '<span class="vitality-badge ' + vClass + '">' + escHtml(s.vitality) + '</span>' : '') +
        '</div>' +
        (s.detail ? '<div class="archive-card-detail">' + escHtml(s.detail) + '</div>' : '') +
        '<div class="archive-card-footer">' +
          '<span class="archive-card-type">' + escHtml(s.type || '') + '</span>' +
          '<span class="archive-card-date">' + formatDate(s.date) + '</span>' +
        '</div>';

      grid.appendChild(card);
    });
  }

  function formatDate (dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function escHtml (str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

}());

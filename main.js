/* ── LARK ARCHIVE — main.js ──────────────────────────────
   Handles:
   - Multi-step form navigation + validation
   - File drag-and-drop
   - Form submission via Formspree (no backend needed)
   - Email notification to contact@lostworldsinstitute.org
────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ── CONFIG ───────────────────────────────────────────
     Replace FORMSPREE_ID with your actual Formspree form ID.
     Sign up free at https://formspree.io → New Form → copy the ID.
     The form ID looks like: xpzvwkqd
     Your endpoint will be: https://formspree.io/f/xpzvwkqd
  ────────────────────────────────────────────────────── */
  var FORMSPREE_ENDPOINT = 'https://formspree.io/f/mzdjlebp';

  /* ── STATE ─────────────────────────────────────────── */
  var currentStep = 1;
  var totalSteps  = 4;
  var attachedFiles = [];

  /* ── INIT ──────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initDropZone();
    initForm();
    updateStepIndicator();
  });

  /* ── STEP NAVIGATION ───────────────────────────────── */
  window.goStep = function (target) {
    if (target > currentStep && !validateStep(currentStep)) return;

    var prev = document.getElementById('step-' + currentStep);
    var next = document.getElementById('step-' + target);

    if (!next) return;

    if (prev) prev.classList.remove('active');
    next.classList.add('active');

    var prevStep = currentStep;
    currentStep  = target;

    updateStepIndicator(prevStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function updateStepIndicator (prevStep) {
    var dots       = document.querySelectorAll('.step-dot');
    var connectors = document.querySelectorAll('.step-connector');

    dots.forEach(function (dot, i) {
      var stepNum = i + 1;
      dot.classList.remove('active', 'done');
      if (stepNum === currentStep) {
        dot.classList.add('active');
        dot.querySelector('.step-dot-num').textContent = stepNum;
      } else if (stepNum < currentStep) {
        dot.classList.add('done');
        dot.querySelector('.step-dot-num').textContent = '✓';
      } else {
        dot.querySelector('.step-dot-num').textContent = stepNum;
      }
    });

    connectors.forEach(function (c, i) {
      c.classList.toggle('done', (i + 1) < currentStep);
    });
  }

  /* ── VALIDATION ────────────────────────────────────── */
  function validateStep (step) {
    var stepEl   = document.getElementById('step-' + step);
    if (!stepEl) return true;
    var required = stepEl.querySelectorAll('[required]');
    var valid    = true;

    required.forEach(function (el) {
      el.classList.remove('error');
      if (!el.value || (el.type === 'checkbox' && !el.checked)) {
        el.classList.add('error');
        valid = false;
      }
    });

    if (!valid) {
      var first = stepEl.querySelector('.error');
      if (first) {
        first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (first.focus) first.focus();
      }
    }

    return valid;
  }

  /* ── DROP ZONE ─────────────────────────────────────── */
  function initDropZone () {
    var zone  = document.getElementById('drop-zone');
    var input = document.getElementById('file-input');
    if (!zone || !input) return;

    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', function () {
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('drag-over');
      addFiles(Array.from(e.dataTransfer.files));
    });

    input.addEventListener('change', function () {
      addFiles(Array.from(input.files));
      input.value = '';
    });
  }

  function addFiles (files) {
    var list = document.getElementById('file-list');
    if (!list) return;

    files.forEach(function (file) {
      if (attachedFiles.find(function (f) { return f.name === file.name; })) return;
      attachedFiles.push(file);

      var ext  = file.name.split('.').pop().toLowerCase();
      var type = ['wav', 'mp3', 'm4a', 'aiff', 'flac'].includes(ext) ? 'audio'
               : ['mp4', 'mov', 'webm', 'avi'].includes(ext)          ? 'video'
               : 'doc';

      var size = file.size > 1048576
               ? (file.size / 1048576).toFixed(1) + ' MB'
               : (file.size / 1024).toFixed(0) + ' KB';

      var label = type === 'audio' ? 'Audio'
                : type === 'video' ? 'Video'
                : ext.toUpperCase();

      var li = document.createElement('li');
      li.className = 'file-item';
      li.dataset.name = file.name;
      li.innerHTML =
        '<span class="file-badge ' + type + '">' + label + '</span>' +
        '<span class="file-info">' +
          '<span class="file-name">' + escHtml(file.name) + '</span>' +
          '<span class="file-size">' + size + '</span>' +
        '</span>' +
        '<button type="button" class="file-remove" aria-label="Remove file">&times;</button>';

      li.querySelector('.file-remove').addEventListener('click', function () {
        attachedFiles = attachedFiles.filter(function (f) { return f.name !== file.name; });
        li.remove();
      });

      list.appendChild(li);
    });
  }

  /* ── FORM SUBMISSION ───────────────────────────────── */
  function initForm () {
    var form = document.getElementById('lark-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateStep(4)) return;
      submitForm(form);
    });
  }

  function submitForm (form) {
    var btn = document.getElementById('submit-btn');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    /* Build FormData — Formspree picks this up and emails
       contact@lostworldsinstitute.org (configured in Formspree dashboard) */
    var data = new FormData();

    /* Hidden fields that drive the email notification */
    data.append('_subject', 'New LARK Archive Bundle — ' + getVal('lang-name'));
    data.append('_replyto', getVal('submitter-email'));

    /* Language */
    data.append('Language name',    getVal('lang-name'));
    data.append('ISO 639-3 code',   getVal('lang-iso'));
    data.append('Dialect',          getVal('lang-dialect'));
    data.append('Language family',  getVal('lang-family'));
    data.append('Vitality status',  getVal('vitality'));
    data.append('Speaker count',    getVal('speaker-count'));

    /* Speaker / session */
    data.append('Speaker code',     getVal('speaker-code'));
    data.append('Session date',     getVal('session-date'));
    data.append('Age range',        getVal('age-range'));
    data.append('Session type',     getVal('session-type'));
    data.append('Topics covered',   getVal('topics'));
    data.append('Submitter name',   getVal('submitter-name'));
    data.append('Submitter email',  getVal('submitter-email'));

    /* Consent */
    data.append('Consent form ref', getVal('consent-ref'));
    data.append('Access level',     getCheckedRadio('access_level'));
    data.append('Restrictions',     getVal('restrictions'));
    data.append('Triage flagged',   document.getElementById('triage') && document.getElementById('triage').checked ? 'Yes' : 'No');

    /* File list (names only — Formspree free tier doesn't store files;
       upgrade to Gold for attachment storage, or use a separate service) */
    if (attachedFiles.length > 0) {
      var fileNames = attachedFiles.map(function (f) { return f.name; }).join(', ');
      data.append('Attached files (names)', fileNames);
    }

    /* Note: to send actual files, append each one:
       attachedFiles.forEach(function(f) { data.append('file', f, f.name); });
       This requires Formspree Gold ($40/mo) or a separate file host (S3, Cloudflare R2, etc.) */

    fetch(FORMSPREE_ENDPOINT, {
      method:  'POST',
      body:    data,
      headers: { 'Accept': 'application/json' }
    })
    .then(function (res) {
      if (res.ok) return res.json();
      return res.json().then(function (d) { throw new Error(d.error || 'Submission failed'); });
    })
    .then(function () {
      showSuccess();
    })
    .catch(function (err) {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      alert('Something went wrong: ' + err.message + '\n\nPlease email contact@lostworldsinstitute.org directly.');
    });
  }

  function showSuccess () {
    var allSteps = document.querySelectorAll('.form-step');
    allSteps.forEach(function (s) { s.classList.remove('active'); });

    var success = document.getElementById('step-success');
    if (success) success.classList.add('active');

    /* Generate bundle ID for display */
    var iso  = (getVal('lang-iso') || 'UNK').toUpperCase();
    var date = (getVal('session-date') || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    var rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    var id   = 'LARK-' + iso + '-' + date + '-' + rand;

    var idEl = document.getElementById('success-bundle-id');
    if (idEl) idEl.textContent = id;

    /* Mark all step dots done */
    document.querySelectorAll('.step-dot').forEach(function (d) {
      d.classList.remove('active');
      d.classList.add('done');
      d.querySelector('.step-dot-num').textContent = '✓';
    });
    document.querySelectorAll('.step-connector').forEach(function (c) {
      c.classList.add('done');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.resetForm = function () {
    var form = document.getElementById('lark-form');
    if (form) form.reset();

    attachedFiles = [];
    var fileList = document.getElementById('file-list');
    if (fileList) fileList.innerHTML = '';

    currentStep = 1;

    var allSteps = document.querySelectorAll('.form-step');
    allSteps.forEach(function (s) { s.classList.remove('active'); });

    var first = document.getElementById('step-1');
    if (first) first.classList.add('active');

    updateStepIndicator();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── HELPERS ───────────────────────────────────────── */
  function getVal (id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function getCheckedRadio (name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function escHtml (str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

}());

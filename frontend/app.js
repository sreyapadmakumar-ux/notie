/**
 * Notie - Notes Management System
 * Pure frontend app using localStorage
 * Works on GitHub Pages, any phone, any laptop - no server needed
 */

// ===== localStorage Data Layer =====
function getNotes() {
  try { return JSON.parse(localStorage.getItem('notie-notes') || '[]'); }
  catch(e) { return []; }
}

function saveNotes(notes) {
  localStorage.setItem('notie-notes', JSON.stringify(notes));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ===== State =====
let notes = [];
let currentNote = null;
let editingId = null;
let currentCategory = 'All';
let searchQuery = '';
let selectedColor = '#1e1e2e';

// ===== DOM =====
const $ = (id) => document.getElementById(id);
const el = {
  sidebar: $('sidebar'),
  sidebarToggle: $('sidebar-toggle'),
  notesGrid: $('notes-grid'),
  loading: $('loading'),
  emptyState: $('empty-state'),
  noResults: $('no-results'),
  notesSection: $('notes-section'),
  noteView: $('note-view'),
  searchInput: $('search-input'),
  categoryList: $('category-list'),
  noteCount: $('note-count'),
  modalOverlay: $('modal-overlay'),
  noteForm: $('note-form'),
  modalTitle: $('modal-title'),
  inputTitle: $('input-title'),
  inputContent: $('input-content'),
  inputCategory: $('input-category'),
  inputFont: $('input-font'),
  btnNewNote: $('btn-new-note'),
  btnEmptyNew: $('btn-empty-new'),
  btnCloseModal: $('btn-close-modal'),
  btnCancel: $('btn-cancel'),
  btnSave: $('btn-save'),
  saveText: $('save-text'),
  saveSpinner: $('save-spinner'),
  btnBack: $('btn-back'),
  btnEdit: $('btn-edit'),
  btnDelete: $('btn-delete'),
  btnPin: $('btn-pin'),
  viewTitle: $('view-title'),
  viewBody: $('view-body'),
  viewCategory: $('view-category'),
  viewDate: $('view-date'),
  btnToggleTheme: $('btn-toggle-theme'),
  toastContainer: $('toast-container'),
  recentList: $('recent-list'),
  btnViewAll: $('btn-view-all'),
  statTotal: $('stat-total'),
  statPinned: $('stat-pinned'),
};

// ===== Data Functions =====
function fetchNotes() {
  el.loading.style.display = 'flex';
  el.notesGrid.style.display = 'none';

  let all = getNotes();

  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    all = all.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.category && n.category.toLowerCase().includes(q))
    );
  }

  // Category filter
  if (currentCategory !== 'All') {
    all = all.filter(n => n.category === currentCategory);
  }

  // Sort: pinned first, then newest
  all.sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
    return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
  });

  notes = all;
  renderNotes();
  updateStats();
  renderRecent();
  renderCategories();

  el.loading.style.display = 'none';
  el.notesGrid.style.display = 'grid';
}

function createNote(data) {
  const note = {
    _id: genId(),
    title: data.title,
    content: data.content,
    category: data.category || 'General',
    fontStyle: data.fontStyle || 'default',
    color: data.color || '#1e1e2e',
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all = getNotes();
  all.unshift(note);
  saveNotes(all);
  return note;
}

function updateNote(id, data) {
  const all = getNotes();
  const idx = all.findIndex(n => n._id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    saveNotes(all);
    return all[idx];
  }
  return null;
}

function deleteNote(id) {
  saveNotes(getNotes().filter(n => n._id !== id));
}

function togglePin(id) {
  const all = getNotes();
  const note = all.find(n => n._id === id);
  if (note) {
    note.pinned = !note.pinned;
    note.updatedAt = new Date().toISOString();
    saveNotes(all);
    return note.pinned;
  }
  return false;
}

function getNote(id) {
  return getNotes().find(n => n._id === id) || null;
}

function getCategories() {
  const cats = new Set(getNotes().map(n => n.category || 'General'));
  return ['All', ...cats];
}

// ===== UI Rendering =====
function renderNotes() {
  el.notesGrid.innerHTML = '';

  if (notes.length === 0 && !searchQuery && currentCategory === 'All') {
    el.emptyState.style.display = 'block';
    el.noResults.style.display = 'none';
    el.notesGrid.style.display = 'none';
    return;
  }
  if (notes.length === 0) {
    el.noResults.style.display = 'block';
    el.emptyState.style.display = 'none';
    el.notesGrid.style.display = 'none';
    return;
  }

  el.emptyState.style.display = 'none';
  el.noResults.style.display = 'none';
  el.notesGrid.style.display = 'grid';

  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = `note-card font-${note.fontStyle || 'default'}${note.pinned ? ' pinned' : ''}`;
    if (note.color) {
      card.style.borderLeftColor = note.color;
      card.style.borderLeftWidth = '3px';
    }
    const d = new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    card.innerHTML = `
      <div class="note-card-header"><span class="note-card-category">${esc(note.category || 'General')}</span></div>
      <h3 class="note-card-title">${esc(note.title)}</h3>
      <p class="note-card-content">${esc(note.content)}</p>
      <div class="note-card-footer">
        <span class="note-card-date">${d}</span>
        <div class="note-card-actions">
          <button class="btn-icon btn-pin-card ${note.pinned ? 'pinned' : ''}" title="${note.pinned ? 'Unpin' : 'Pin'}">&#128204;</button>
          <button class="btn-icon btn-delete-card" title="Delete">&#128465;</button>
        </div>
      </div>`;
    card.addEventListener('click', e => {
      if (e.target.closest('.note-card-actions')) return;
      viewNote(note._id);
    });
    card.querySelector('.btn-pin-card').addEventListener('click', e => {
      e.stopPropagation();
      const pinned = togglePin(note._id);
      toast(`Note ${pinned ? 'pinned' : 'unpinned'}!`, 'success');
      fetchNotes();
    });
    card.querySelector('.btn-delete-card').addEventListener('click', e => {
      e.stopPropagation();
      confirmDelete(note._id, note.title);
    });
    el.notesGrid.appendChild(card);
  });
}

function renderCategories() {
  el.categoryList.innerHTML = '';
  getCategories().forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `category-btn${cat === currentCategory ? ' active' : ''}`;
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      currentCategory = cat;
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fetchNotes();
    });
    el.categoryList.appendChild(btn);
  });
}

function updateStats() {
  el.statTotal.textContent = notes.length;
  el.statPinned.textContent = notes.filter(n => n.pinned).length;
  el.noteCount.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
}

function renderRecent() {
  el.recentList.innerHTML = '';
  if (notes.length === 0) {
    el.recentList.innerHTML = '<div class="recent-empty"><span>&#128221;</span><p>No recent notes</p></div>';
    return;
  }
  notes.slice(0, 5).forEach(note => {
    const item = document.createElement('div');
    item.className = `recent-item${note.pinned ? ' pinned' : ''}`;
    item.innerHTML = `
      <div class="recent-item-color" style="background:${note.color || '#7c3aed'}"></div>
      <div class="recent-item-content">
        <div class="recent-item-title">${esc(note.title)}</div>
        <div class="recent-item-meta">
          <span class="recent-item-category">${esc(note.category || 'General')}</span>
          <span class="recent-item-time">${timeAgo(note.updatedAt || note.createdAt)}</span>
        </div>
      </div>
      ${note.pinned ? '<span class="recent-item-pin">&#128204;</span>' : ''}`;
    item.addEventListener('click', () => viewNote(note._id));
    el.recentList.appendChild(item);
  });
}

// ===== Note View =====
function viewNote(id) {
  const note = getNote(id);
  if (!note) return;
  currentNote = note;
  el.viewBody.className = `note-body font-${note.fontStyle || 'default'}`;
  el.viewTitle.textContent = note.title;
  el.viewBody.textContent = note.content;
  el.viewCategory.textContent = note.category || 'General';
  el.viewDate.textContent = new Date(note.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  el.btnPin.classList.toggle('pinned', note.pinned);
  el.btnPin.title = note.pinned ? 'Unpin Note' : 'Pin Note';
  el.notesSection.style.display = 'none';
  el.noteView.style.display = 'block';
}

function closeNoteView() {
  currentNote = null;
  el.notesSection.style.display = 'block';
  el.noteView.style.display = 'none';
}

// ===== Modal =====
function openModal(note) {
  editingId = note ? note._id : null;
  el.modalTitle.textContent = note ? 'Edit Note' : 'New Note';
  el.saveText.textContent = note ? 'Update' : 'Save Note';
  el.inputTitle.value = note ? note.title : '';
  el.inputContent.value = note ? note.content : '';
  el.inputCategory.value = note ? (note.category || 'General') : 'General';
  el.inputFont.value = note ? (note.fontStyle || 'default') : 'default';
  selectedColor = note ? (note.color || '#1e1e2e') : '#1e1e2e';
  document.querySelectorAll('.color-option').forEach(o => o.classList.toggle('active', o.dataset.color === selectedColor));
  el.modalOverlay.style.display = 'flex';
  el.inputTitle.focus();
}

function closeModal() {
  el.modalOverlay.style.display = 'none';
  editingId = null;
  el.noteForm.reset();
  selectedColor = '#1e1e2e';
  document.querySelectorAll('.color-option').forEach(o => o.classList.toggle('active', o.dataset.color === '#1e1e2e'));
}

// ===== Confirm Delete =====
function confirmDelete(id, title) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-dialog">
      <h3>Delete Note</h3>
      <p>Are you sure you want to delete "${esc(title)}"?</p>
      <div class="confirm-actions">
        <button class="btn-cancel">Cancel</button>
        <button class="btn-danger">Delete</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.btn-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.btn-danger').addEventListener('click', () => {
    overlay.remove();
    deleteNote(id);
    toast('Note deleted!', 'success');
    closeNoteView();
    fetchNotes();
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ===== Utilities =====
function esc(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function timeAgo(dateStr) {
  const s = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function toast(msg, type) {
  const t = document.createElement('div');
  t.className = `toast toast-${type || 'info'}`;
  const icons = { success: '&#10003;', error: '&#10007;', info: '&#8505;' };
  t.innerHTML = `<span>${icons[type] || icons.info}</span> ${esc(msg)}`;
  el.toastContainer.appendChild(t);
  setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 300); }, 3000);
}

// ===== Event Listeners =====
el.btnNewNote.addEventListener('click', () => openModal());
el.btnEmptyNew.addEventListener('click', () => openModal());
el.btnCloseModal.addEventListener('click', closeModal);
el.btnCancel.addEventListener('click', closeModal);
el.modalOverlay.addEventListener('click', e => { if (e.target === el.modalOverlay) closeModal(); });

el.noteForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = {
    title: el.inputTitle.value.trim(),
    content: el.inputContent.value.trim(),
    category: el.inputCategory.value.trim() || 'General',
    fontStyle: el.inputFont.value,
    color: selectedColor,
  };
  if (!data.title || !data.content) { toast('Title and content required.', 'error'); return; }
  if (editingId) {
    updateNote(editingId, data);
    toast('Note updated!', 'success');
    if (currentNote && currentNote._id === editingId) viewNote(editingId);
  } else {
    createNote(data);
    toast('Note created!', 'success');
  }
  closeModal();
  fetchNotes();
});

el.btnBack.addEventListener('click', closeNoteView);
el.btnEdit.addEventListener('click', () => { if (currentNote) openModal(currentNote); });
el.btnDelete.addEventListener('click', () => { if (currentNote) confirmDelete(currentNote._id, currentNote.title); });
el.btnPin.addEventListener('click', () => {
  if (!currentNote) return;
  const pinned = togglePin(currentNote._id);
  currentNote.pinned = pinned;
  el.btnPin.classList.toggle('pinned', pinned);
  toast(`Note ${pinned ? 'pinned' : 'unpinned'}!`, 'success');
  fetchNotes();
});

let searchTimeout;
el.searchInput.addEventListener('input', e => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { searchQuery = e.target.value.trim(); fetchNotes(); }, 300);
});

document.querySelectorAll('.color-option').forEach(o => {
  o.addEventListener('click', () => {
    selectedColor = o.dataset.color;
    document.querySelectorAll('.color-option').forEach(x => x.classList.remove('active'));
    o.classList.add('active');
  });
});

el.sidebarToggle.addEventListener('click', () => {
  el.sidebar.classList.toggle('collapsed');
  if (window.innerWidth <= 768) el.sidebar.classList.toggle('open');
});

document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    el.notesGrid.classList.toggle('list-view', btn.dataset.view === 'list');
  });
});

el.btnToggleTheme.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('notie-theme', next);
  $('theme-icon').innerHTML = next === 'light' ? '&#9728;' : '&#9790;';
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (el.modalOverlay.style.display === 'flex') closeModal();
    else if (el.noteView.style.display === 'block') closeNoteView();
  }
  if (e.ctrlKey && e.key === 'n') { e.preventDefault(); openModal(); }
});

document.addEventListener('click', e => {
  if (window.innerWidth <= 768 && el.sidebar.classList.contains('open') && !el.sidebar.contains(e.target) && e.target !== el.sidebarToggle) {
    el.sidebar.classList.remove('open');
  }
});

el.btnViewAll.addEventListener('click', () => {
  el.notesSection.scrollIntoView({ behavior: 'smooth' });
  if (window.innerWidth <= 768) el.sidebar.classList.remove('open');
});

// ===== Init =====
const savedTheme = localStorage.getItem('notie-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
$('theme-icon').innerHTML = savedTheme === 'light' ? '&#9728;' : '&#9790;';
fetchNotes();

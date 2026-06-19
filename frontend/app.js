/**
 * Notie - Notes Management System
 * Frontend JavaScript Application
 * Works with backend API or localStorage fallback (GitHub Pages compatible)
 */

// ===== Configuration =====
const API_URL = `${window.location.origin}/api/notes`;

// ===== State Management =====
let notes = [];
let currentNote = null;
let editingNoteId = null;
let currentCategory = 'All';
let searchQuery = '';
let selectedColor = '#1e1e2e';
let useLocalStorage = false; // Falls back to localStorage if API unavailable

// ===== localStorage Helpers =====
function getLocalNotes() {
  try {
    return JSON.parse(localStorage.getItem('notie-notes') || '[]');
  } catch {
    return [];
  }
}

function saveLocalNotes(notesArray) {
  localStorage.setItem('notie-notes', JSON.stringify(notesArray));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ===== DOM Elements =====
const elements = {
  sidebar: document.getElementById('sidebar'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
  notesGrid: document.getElementById('notes-grid'),
  loading: document.getElementById('loading'),
  emptyState: document.getElementById('empty-state'),
  noResults: document.getElementById('no-results'),
  notesSection: document.getElementById('notes-section'),
  noteView: document.getElementById('note-view'),
  searchInput: document.getElementById('search-input'),
  categoryList: document.getElementById('category-list'),
  noteCount: document.getElementById('note-count'),
  modalOverlay: document.getElementById('modal-overlay'),
  noteForm: document.getElementById('note-form'),
  modalTitle: document.getElementById('modal-title'),
  inputTitle: document.getElementById('input-title'),
  inputContent: document.getElementById('input-content'),
  inputCategory: document.getElementById('input-category'),
  inputFont: document.getElementById('input-font'),
  btnNewNote: document.getElementById('btn-new-note'),
  btnEmptyNew: document.getElementById('btn-empty-new'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  btnCancel: document.getElementById('btn-cancel'),
  btnSave: document.getElementById('btn-save'),
  saveText: document.getElementById('save-text'),
  saveSpinner: document.getElementById('save-spinner'),
  btnBack: document.getElementById('btn-back'),
  btnEdit: document.getElementById('btn-edit'),
  btnDelete: document.getElementById('btn-delete'),
  btnPin: document.getElementById('btn-pin'),
  viewTitle: document.getElementById('view-title'),
  viewBody: document.getElementById('view-body'),
  viewCategory: document.getElementById('view-category'),
  viewDate: document.getElementById('view-date'),
  btnToggleTheme: document.getElementById('btn-toggle-theme'),
  toastContainer: document.getElementById('toast-container'),
  recentList: document.getElementById('recent-list'),
  btnViewAll: document.getElementById('btn-view-all'),
  statTotal: document.getElementById('stat-total'),
  statPinned: document.getElementById('stat-pinned'),
};

// ===== Detect if API is available =====
async function checkApiAvailable() {
  try {
    const response = await fetch(`${window.location.origin}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}

// ===== Unified Data Layer (API or localStorage) =====

async function fetchNotes() {
  try {
    showLoading(true);

    if (useLocalStorage) {
      // localStorage mode
      let localNotes = getLocalNotes();
      // Apply search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        localNotes = localNotes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            (n.category && n.category.toLowerCase().includes(q))
        );
      }
      // Apply category filter
      if (currentCategory !== 'All') {
        localNotes = localNotes.filter((n) => n.category === currentCategory);
      }
      // Sort: pinned first, then by date
      localNotes.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      });
      notes = localNotes;
      renderNotes();
      updateNoteCount();
      updateQuickStats();
      renderRecentNotes();
      loadCategoriesLocal();
      showLoading(false);
      return;
    }

    // API mode
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (currentCategory !== 'All') params.append('category', currentCategory);

    const response = await fetch(`${API_URL}?${params}`);
    const data = await response.json();

    if (data.success) {
      notes = data.data;
      renderNotes();
      updateNoteCount();
      updateQuickStats();
      renderRecentNotes();
      loadCategories();
    }
  } catch (error) {
    console.error('Error fetching notes:', error);
    // If API fails, switch to localStorage
    if (!useLocalStorage) {
      useLocalStorage = true;
      showToast('Offline mode - using local storage', 'info');
      fetchNotes();
      return;
    }
    showToast('Failed to load notes.', 'error');
  } finally {
    showLoading(false);
  }
}

async function fetchNoteById(id) {
  if (useLocalStorage) {
    const localNotes = getLocalNotes();
    return localNotes.find((n) => n._id === id) || null;
  }
  try {
    const response = await fetch(`${API_URL}/${id}`);
    const data = await response.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

async function createNote(noteData) {
  try {
    toggleSaveButton(true);

    if (useLocalStorage) {
      const newNote = {
        _id: generateId(),
        ...noteData,
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const localNotes = getLocalNotes();
      localNotes.unshift(newNote);
      saveLocalNotes(localNotes);
      showToast('Note created successfully!', 'success');
      closeModal();
      fetchNotes();
      toggleSaveButton(false);
      return;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData),
    });
    const data = await response.json();

    if (data.success) {
      showToast('Note created successfully!', 'success');
      closeModal();
      fetchNotes();
    } else {
      showToast(data.message || 'Failed to create note.', 'error');
    }
  } catch (error) {
    // Fallback to localStorage
    if (!useLocalStorage) {
      useLocalStorage = true;
      showToast('Offline mode - saving locally', 'info');
      await createNote(noteData);
      return;
    }
    showToast('Failed to create note.', 'error');
  } finally {
    toggleSaveButton(false);
  }
}

async function updateNote(id, noteData) {
  try {
    toggleSaveButton(true);

    if (useLocalStorage) {
      const localNotes = getLocalNotes();
      const index = localNotes.findIndex((n) => n._id === id);
      if (index !== -1) {
        localNotes[index] = {
          ...localNotes[index],
          ...noteData,
          updatedAt: new Date().toISOString(),
        };
        saveLocalNotes(localNotes);
        showToast('Note updated successfully!', 'success');
        closeModal();
        fetchNotes();
        if (currentNote && currentNote._id === id) {
          viewNote(id);
        }
      }
      toggleSaveButton(false);
      return;
    }

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData),
    });
    const data = await response.json();

    if (data.success) {
      showToast('Note updated successfully!', 'success');
      closeModal();
      fetchNotes();
      if (currentNote && currentNote._id === id) {
        viewNote(id);
      }
    } else {
      showToast(data.message || 'Failed to update note.', 'error');
    }
  } catch (error) {
    if (!useLocalStorage) {
      useLocalStorage = true;
      await updateNote(id, noteData);
      return;
    }
    showToast('Failed to update note.', 'error');
  } finally {
    toggleSaveButton(false);
  }
}

async function deleteNote(id) {
  try {
    if (useLocalStorage) {
      let localNotes = getLocalNotes();
      localNotes = localNotes.filter((n) => n._id !== id);
      saveLocalNotes(localNotes);
      showToast('Note deleted successfully!', 'success');
      closeNoteView();
      fetchNotes();
      return;
    }

    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    const data = await response.json();

    if (data.success) {
      showToast('Note deleted successfully!', 'success');
      closeNoteView();
      fetchNotes();
    } else {
      showToast(data.message || 'Failed to delete note.', 'error');
    }
  } catch (error) {
    if (!useLocalStorage) {
      useLocalStorage = true;
      await deleteNote(id);
      return;
    }
    showToast('Failed to delete note.', 'error');
  }
}

async function togglePin(id) {
  try {
    if (useLocalStorage) {
      const localNotes = getLocalNotes();
      const note = localNotes.find((n) => n._id === id);
      if (note) {
        note.pinned = !note.pinned;
        note.updatedAt = new Date().toISOString();
        saveLocalNotes(localNotes);
        showToast(`Note ${note.pinned ? 'pinned' : 'unpinned'}!`, 'success');
        fetchNotes();
        if (currentNote && currentNote._id === id) {
          currentNote.pinned = note.pinned;
          updatePinButton();
        }
      }
      return;
    }

    const response = await fetch(`${API_URL}/${id}/pin`, { method: 'PATCH' });
    const data = await response.json();

    if (data.success) {
      showToast(`Note ${data.data.pinned ? 'pinned' : 'unpinned'}!`, 'success');
      fetchNotes();
      if (currentNote && currentNote._id === id) {
        currentNote.pinned = data.data.pinned;
        updatePinButton();
      }
    }
  } catch (error) {
    if (!useLocalStorage) {
      useLocalStorage = true;
      await togglePin(id);
      return;
    }
    showToast('Failed to toggle pin.', 'error');
  }
}

async function loadCategories() {
  if (useLocalStorage) {
    loadCategoriesLocal();
    return;
  }
  try {
    const response = await fetch(`${API_URL}/categories/list`);
    const data = await response.json();
    if (data.success) {
      renderCategories(data.data);
    }
  } catch {
    loadCategoriesLocal();
  }
}

function loadCategoriesLocal() {
  const localNotes = getLocalNotes();
  const cats = ['All', ...new Set(localNotes.map((n) => n.category || 'General'))];
  renderCategories(cats);
}

// ===== UI Rendering =====

function renderNotes() {
  const grid = elements.notesGrid;
  grid.innerHTML = '';

  if (notes.length === 0 && !searchQuery && currentCategory === 'All') {
    elements.emptyState.style.display = 'block';
    elements.noResults.style.display = 'none';
    grid.style.display = 'none';
    return;
  }

  if (notes.length === 0 && (searchQuery || currentCategory !== 'All')) {
    elements.noResults.style.display = 'block';
    elements.emptyState.style.display = 'none';
    grid.style.display = 'none';
    return;
  }

  elements.emptyState.style.display = 'none';
  elements.noResults.style.display = 'none';
  grid.style.display = 'grid';

  notes.forEach((note) => {
    grid.appendChild(createNoteCard(note));
  });
}

function createNoteCard(note) {
  const card = document.createElement('div');
  card.className = `note-card font-${note.fontStyle || 'default'}${note.pinned ? ' pinned' : ''}`;
  if (note.color) {
    card.style.borderLeftColor = note.color;
    card.style.borderLeftWidth = '3px';
  }

  const createdDate = new Date(note.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  card.innerHTML = `
    <div class="note-card-header">
      <span class="note-card-category">${escapeHtml(note.category || 'General')}</span>
    </div>
    <h3 class="note-card-title">${escapeHtml(note.title)}</h3>
    <p class="note-card-content">${escapeHtml(note.content)}</p>
    <div class="note-card-footer">
      <span class="note-card-date">${createdDate}</span>
      <div class="note-card-actions">
        <button class="btn-icon btn-pin-card ${note.pinned ? 'pinned' : ''}" data-id="${note._id}" title="${note.pinned ? 'Unpin' : 'Pin'}">&#128204;</button>
        <button class="btn-icon btn-delete-card" data-id="${note._id}" title="Delete">&#128465;</button>
      </div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    if (e.target.closest('.note-card-actions')) return;
    viewNote(note._id);
  });

  card.querySelector('.btn-pin-card').addEventListener('click', (e) => {
    e.stopPropagation();
    togglePin(note._id);
  });

  card.querySelector('.btn-delete-card').addEventListener('click', (e) => {
    e.stopPropagation();
    confirmDelete(note._id, note.title);
  });

  return card;
}

function renderCategories(categories) {
  const list = elements.categoryList;
  list.innerHTML = '';
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = `category-btn${cat === currentCategory ? ' active' : ''}`;
    btn.dataset.category = cat;
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      currentCategory = cat;
      document.querySelectorAll('.category-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      fetchNotes();
    });
    list.appendChild(btn);
  });
}

async function viewNote(id) {
  const note = await fetchNoteById(id);
  if (!note) return;

  currentNote = note;
  elements.viewBody.className = `note-body font-${note.fontStyle || 'default'}`;
  elements.viewTitle.textContent = note.title;
  elements.viewBody.textContent = note.content;
  elements.viewCategory.textContent = note.category || 'General';
  elements.viewDate.textContent = new Date(note.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  updatePinButton();
  elements.notesSection.style.display = 'none';
  elements.noteView.style.display = 'block';
}

function updatePinButton() {
  if (!currentNote) return;
  elements.btnPin.classList.toggle('pinned', currentNote.pinned);
  elements.btnPin.title = currentNote.pinned ? 'Unpin Note' : 'Pin Note';
}

function closeNoteView() {
  currentNote = null;
  elements.notesSection.style.display = 'block';
  elements.noteView.style.display = 'none';
}

// ===== Modal =====

function openModal(note = null) {
  editingNoteId = note ? note._id : null;
  elements.modalTitle.textContent = note ? 'Edit Note' : 'New Note';
  elements.saveText.textContent = note ? 'Update' : 'Save Note';

  elements.inputTitle.value = note ? note.title : '';
  elements.inputContent.value = note ? note.content : '';
  elements.inputCategory.value = note ? (note.category || 'General') : 'General';
  elements.inputFont.value = note ? (note.fontStyle || 'default') : 'default';

  selectedColor = note ? (note.color || '#1e1e2e') : '#1e1e2e';
  document.querySelectorAll('.color-option').forEach((opt) => {
    opt.classList.toggle('active', opt.dataset.color === selectedColor);
  });

  elements.modalOverlay.style.display = 'flex';
  elements.inputTitle.focus();
}

function closeModal() {
  elements.modalOverlay.style.display = 'none';
  editingNoteId = null;
  elements.noteForm.reset();
  selectedColor = '#1e1e2e';
  document.querySelectorAll('.color-option').forEach((opt) => {
    opt.classList.toggle('active', opt.dataset.color === '#1e1e2e');
  });
}

// ===== Confirm Dialog =====

function confirmDelete(id, title) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-dialog">
      <h3>Delete Note</h3>
      <p>Are you sure you want to delete "${escapeHtml(title)}"? This action cannot be undone.</p>
      <div class="confirm-actions">
        <button class="btn-cancel" id="confirm-cancel">Cancel</button>
        <button class="btn-danger" id="confirm-delete">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#confirm-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#confirm-delete').addEventListener('click', async () => {
    overlay.remove();
    await deleteNote(id);
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// ===== Utility Functions =====

function showLoading(show) {
  elements.loading.style.display = show ? 'flex' : 'none';
  elements.notesGrid.style.display = show ? 'none' : 'grid';
}

function updateNoteCount() {
  elements.noteCount.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
}

function updateQuickStats() {
  elements.statTotal.textContent = notes.length;
  elements.statPinned.textContent = notes.filter((n) => n.pinned).length;
}

function renderRecentNotes() {
  const list = elements.recentList;
  list.innerHTML = '';

  if (notes.length === 0) {
    list.innerHTML = `<div class="recent-empty"><span>&#128221;</span><p>No recent notes</p></div>`;
    return;
  }

  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  recentNotes.forEach((note) => {
    const item = document.createElement('div');
    item.className = `recent-item${note.pinned ? ' pinned' : ''}`;
    item.innerHTML = `
      <div class="recent-item-color" style="background: ${note.color || '#7c3aed'};"></div>
      <div class="recent-item-content">
        <div class="recent-item-title">${escapeHtml(note.title)}</div>
        <div class="recent-item-meta">
          <span class="recent-item-category">${escapeHtml(note.category || 'General')}</span>
          <span class="recent-item-time">${getTimeAgo(note.updatedAt || note.createdAt)}</span>
        </div>
      </div>
      ${note.pinned ? '<span class="recent-item-pin">&#128204;</span>' : ''}
    `;
    item.addEventListener('click', () => viewNote(note._id));
    list.appendChild(item);
  });
}

function getTimeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function toggleSaveButton(loading) {
  elements.btnSave.disabled = loading;
  elements.saveText.style.display = loading ? 'none' : 'inline';
  elements.saveSpinner.style.display = loading ? 'block' : 'none';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '&#10003;', error: '&#10007;', info: '&#8505;' };
  toast.innerHTML = `<span>${icons[type] || icons.info}</span> ${escapeHtml(message)}`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== Event Listeners =====

elements.btnNewNote.addEventListener('click', () => openModal());
elements.btnEmptyNew.addEventListener('click', () => openModal());
elements.btnCloseModal.addEventListener('click', closeModal);
elements.btnCancel.addEventListener('click', closeModal);
elements.modalOverlay.addEventListener('click', (e) => {
  if (e.target === elements.modalOverlay) closeModal();
});

elements.noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const noteData = {
    title: elements.inputTitle.value.trim(),
    content: elements.inputContent.value.trim(),
    category: elements.inputCategory.value.trim() || 'General',
    fontStyle: elements.inputFont.value,
    color: selectedColor,
  };
  if (!noteData.title || !noteData.content) {
    showToast('Title and content are required.', 'error');
    return;
  }
  editingNoteId ? await updateNote(editingNoteId, noteData) : await createNote(noteData);
});

elements.btnBack.addEventListener('click', closeNoteView);
elements.btnEdit.addEventListener('click', () => { if (currentNote) openModal(currentNote); });
elements.btnDelete.addEventListener('click', () => { if (currentNote) confirmDelete(currentNote._id, currentNote.title); });
elements.btnPin.addEventListener('click', () => { if (currentNote) togglePin(currentNote._id); });

let searchTimeout;
elements.searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchQuery = e.target.value.trim();
    fetchNotes();
  }, 300);
});

document.querySelectorAll('.color-option').forEach((opt) => {
  opt.addEventListener('click', () => {
    selectedColor = opt.dataset.color;
    document.querySelectorAll('.color-option').forEach((o) => o.classList.remove('active'));
    opt.classList.add('active');
  });
});

elements.sidebarToggle.addEventListener('click', () => {
  elements.sidebar.classList.toggle('collapsed');
  if (window.innerWidth <= 768) elements.sidebar.classList.toggle('open');
});

document.querySelectorAll('.view-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    elements.notesGrid.classList.toggle('list-view', btn.dataset.view === 'list');
  });
});

elements.btnToggleTheme.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('notie-theme', next);
  document.getElementById('theme-icon').innerHTML = next === 'light' ? '&#9728;' : '&#9790;';
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (elements.modalOverlay.style.display === 'flex') closeModal();
    else if (elements.noteView.style.display === 'block') closeNoteView();
  }
  if (e.ctrlKey && e.key === 'n') { e.preventDefault(); openModal(); }
});

document.addEventListener('click', (e) => {
  if (window.innerWidth <= 768 && elements.sidebar.classList.contains('open') && !elements.sidebar.contains(e.target) && e.target !== elements.sidebarToggle) {
    elements.sidebar.classList.remove('open');
  }
});

elements.btnViewAll.addEventListener('click', () => {
  elements.notesSection.scrollIntoView({ behavior: 'smooth' });
  if (window.innerWidth <= 768) elements.sidebar.classList.remove('open');
});

// ===== Init =====
async function init() {
  const savedTheme = localStorage.getItem('notie-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.getElementById('theme-icon').innerHTML = savedTheme === 'light' ? '&#9728;' : '&#9790;';

  // Check if backend API is available
  const apiOk = await checkApiAvailable();
  if (!apiOk) {
    useLocalStorage = true;
    console.log('Backend not available - using localStorage');
  }

  fetchNotes();
}

init();

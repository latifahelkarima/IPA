/**
 * focus-card.js
 * Logic for rendering and interacting with Learning Focus Cards
 */

window.FocusCardManager = {
  data: null,
  currentIndex: 0,
  
  async init(jsonUrl) {
    try {
      // Periksa apakah dijalankan tanpa server (file://)
      if (window.location.protocol === 'file:') {
        alert("Aplikasi harus dijalankan menggunakan Local Server (misal: python -m http.server) karena fitur Fetch API untuk memuat materi.json tidak diizinkan pada mode file:// secara langsung.");
        document.getElementById('materi-title').textContent = "Error: Butuh Server Lokal";
        document.getElementById('materi-desc').textContent = "Jalankan 'python -m http.server 8080' lalu buka http://localhost:8080 di browser Anda.";
        return;
      }
      
      const res = await fetch(jsonUrl);
      if (!res.ok) throw new Error('Gagal memuat materi: ' + res.statusText);
      
      this.data = await res.json();
      this.renderHeader();
      this.renderConceptList();
      this.setupEventListeners();
    } catch (e) {
      console.error('Failed to load materi data', e);
      document.getElementById('materi-title').textContent = "Gagal Memuat Materi";
      document.getElementById('materi-desc').textContent = "Silakan periksa koneksi atau local server Anda.";
    }
  },

  renderHeader() {
    document.getElementById('materi-title').textContent = this.data.title;
    document.getElementById('materi-desc').textContent = this.data.description;
  },

  renderConceptList() {
    const container = document.getElementById('concept-list');
    let html = '';
    
    this.data.concepts.forEach((concept, index) => {
      html += `
        <div class="card card-interactive anim-fade-up delay-${(index % 5) + 1}" data-index="${index}" onclick="FocusCardManager.openCard(${index})">
          <div class="flex items-center gap-3">
            <div class="btn-icon">
              <span class="material-icons">${concept.icon || 'menu_book'}</span>
            </div>
            <div>
              <h3 class="text-h3" style="font-size: 1.1rem;">${concept.title}</h3>
              <p class="text-caption">Konsep ${index + 1} dari ${this.data.concepts.length}</p>
            </div>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  },

  openCard(index) {
    this.currentIndex = index;
    const concept = this.data.concepts[index];
    const overlay = document.getElementById('focus-overlay');
    const content = document.getElementById('focus-content');
    
    // Render steps
    let stepsHtml = '';
    if (concept.steps && concept.steps.length > 0) {
      stepsHtml = '<ul style="margin-top: 16px; padding-left: 20px; color: var(--text-secondary); line-height: 1.6;">';
      concept.steps.forEach(step => {
        stepsHtml += `<li style="margin-bottom: 8px;">${step}</li>`;
      });
      stepsHtml += '</ul>';
    }

    // Simple markdown parser for bold and italic
    const parseMarkdown = (text) => {
      if (!text) return '';
      return text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>');
    };

    content.innerHTML = `
      <div style="margin-bottom: 24px;">
        <span class="date-badge mb-2">Konsep ${index + 1} / ${this.data.concepts.length}</span>
        <h2 class="text-h2 mt-2">${concept.title}</h2>
      </div>
      
      <div class="text-body" style="font-size: 1.1rem; line-height: 1.7; margin-bottom: 24px;">
        ${parseMarkdown(concept.content)}
      </div>
      
      ${stepsHtml}
      
      <div style="margin-top: 32px; padding: 16px; background-color: var(--chip-bg); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <h4 style="color: var(--accent-primary); font-weight: 700; margin-bottom: 8px;">Ringkasan:</h4>
        <p class="text-body" style="font-weight: 500;">${concept.summary}</p>
      </div>
    `;
    
    // Trigger KaTeX jika ada
    if (window.renderMathInElement) {
      window.renderMathInElement(content, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ],
        throwOnError: false
      });
    }

    // Show overlay
    overlay.classList.add('active');
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
    
    this.updateNavigation();
  },

  closeCard() {
    const overlay = document.getElementById('focus-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Save progress if it's the last card
    if (this.currentIndex === this.data.concepts.length - 1) {
      // Assuming ID is in URL or data
      const pathParts = window.location.pathname.split('/');
      const slug = pathParts[pathParts.length - 2];
      if(window.Storage) Storage.saveProgress(slug, 100);
    }
  },

  nextCard() {
    if (this.currentIndex < this.data.concepts.length - 1) {
      this.openCard(this.currentIndex + 1);
    } else {
      this.closeCard();
      // Redirect to quiz
      if (confirm('Selamat! Anda telah menyelesaikan materi. Lanjut ke kuis?')) {
        const pathParts = window.location.pathname.split('/').filter(p => p.length > 0);
        // Cari posisi folder 'materi' lalu ambil nama folder persis setelahnya (slug)
        const materiIndex = pathParts.indexOf('materi');
        const slug = materiIndex !== -1 ? pathParts[materiIndex + 1] : pathParts[pathParts.length - 2];
        
        window.location.href = `../../quiz.html?materi=${slug}`;
      }
    }
  },

  prevCard() {
    if (this.currentIndex > 0) {
      this.openCard(this.currentIndex - 1);
    }
  },

  updateNavigation() {
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    
    btnPrev.style.visibility = this.currentIndex === 0 ? 'hidden' : 'visible';
    
    if (this.currentIndex === this.data.concepts.length - 1) {
      btnNext.innerHTML = 'Selesai <span class="material-icons">check</span>';
      btnNext.classList.remove('btn-outline');
      btnNext.classList.add('btn-primary');
    } else {
      btnNext.innerHTML = 'Lanjut <span class="material-icons">arrow_forward</span>';
      btnNext.classList.remove('btn-primary');
      btnNext.classList.add('btn-outline');
    }
  },

  setupEventListeners() {
    document.getElementById('btn-close-focus').addEventListener('click', () => this.closeCard());
    document.getElementById('btn-next').addEventListener('click', () => this.nextCard());
    document.getElementById('btn-prev').addEventListener('click', () => this.prevCard());
  }
};

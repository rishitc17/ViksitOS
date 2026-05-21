// Citizen Documents Module
const supabase = window.ViksitOS ? window.ViksitOS.supabase : null;

async function initDocuments(container) {
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading documents...</p></div>';

  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('citizen_id', userProfile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!documents || documents.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-file-shield"></i>
          <h3>No Documents Yet</h3>
          <p>Approved applications will generate documents here</p>
          <button class="btn btn-primary mt-2" onclick="openApp('apply')">
            <i class="fa-solid fa-plus"></i> Apply for a Service
          </button>
        </div>
      `;
      return;
    }

    renderDocumentsList(container, documents);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-circle-exclamation"></i>
        <h3>Error Loading Documents</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

function renderDocumentsList(container, documents) {
  let html = `
    <div class="search-container">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input type="text" class="search-input" id="docSearchInput" placeholder="Search documents...">
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${documents.length}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--success)">${documents.filter(d => d.status === 'active').length}</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--text-muted)">${documents.filter(d => d.status === 'expired').length}</div>
        <div class="stat-label">Expired</div>
      </div>
    </div>
    <div class="doc-list" id="docList">
  `;

  for (const doc of documents) {
    const statusClass = `badge-${doc.status}`;
    const docIcon = getDocumentIcon(doc.document_type);

    html += `
      <div class="doc-item-card" data-search="${doc.document_name.toLowerCase()} ${doc.document_type} ${doc.status}">
        <div class="doc-item-header">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:48px;height:48px;border-radius:var(--radius-md);background:linear-gradient(135deg,var(--green),var(--green-dark));display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">
              <i class="fa-solid ${docIcon}"></i>
            </div>
            <div>
              <div class="doc-item-title">${doc.document_name}</div>
              <div class="doc-item-meta">
                <span><i class="fa-regular fa-calendar"></i> Issued: ${formatDate(doc.issued_date)}</span>
                ${doc.document_number ? `<span><i class="fa-solid fa-hashtag"></i> ${doc.document_number}</span>` : ''}
              </div>
            </div>
          </div>
          <span class="badge ${statusClass}">${doc.status}</span>
        </div>
        ${doc.valid_until ? `
          <div style="margin-top:12px;font-size:13px;color:var(--text-secondary);">
            <i class="fa-solid fa-clock"></i> Valid until: ${formatDate(doc.valid_until)}
          </div>
        ` : ''}
        <div style="margin-top:12px;display:flex;gap:8px;">
          <button class="btn btn-sm btn-outline" onclick="viewDocument('${doc.id}')">
            <i class="fa-solid fa-eye"></i> View
          </button>
          <button class="btn btn-sm btn-outline" onclick="downloadDocument('${doc.id}')">
            <i class="fa-solid fa-download"></i> Download
          </button>
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;

  // Search functionality
  const searchInput = container.querySelector('#docSearchInput');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    container.querySelectorAll('.doc-item-card').forEach(card => {
      const searchData = card.dataset.search;
      card.style.display = searchData.includes(query) ? 'block' : 'none';
    });
  });
}

function getDocumentIcon(type) {
  const icons = {
    'birth_certificate': 'fa-baby',
    'death_certificate': 'fa-cross',
    'marriage_certificate': 'fa-rings-wedding',
    'residence_certificate': 'fa-house-chimney',
    'income_certificate': 'fa-indian-rupee-sign',
    'caste_certificate': 'fa-id-card',
    'domicile_certificate': 'fa-map-location-dot',
    'survival_certificate': 'fa-heart-pulse',
    'aadhar': 'fa-fingerprint',
    'pan': 'fa-id-badge',
    'voter_id': 'fa-check-to-slot',
    'passport': 'fa-passport',
    'driving_license': 'fa-car',
    'ration_card': 'fa-credit-card'
  };
  return icons[type] || 'fa-file';
}

function viewDocument(docId) {
  showToast('Document viewer coming soon', 'info');
}

function downloadDocument(docId) {
  showToast('Document download coming soon', 'info');
}

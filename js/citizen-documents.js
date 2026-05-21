// Citizen Documents Module

async function initDocuments(container) {
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading documents...</p></div>';

  try {
    var { data: documents, error } = await window.ViksitOS.supabase
      .from('documents')
      .select('*')
      .eq('citizen_id', userProfile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!documents || documents.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-file-shield"></i><h3>No Documents Yet</h3><p>Approved applications will generate documents here</p><button class="btn btn-primary mt-2" onclick="openApp(\'apply\')"><i class="fa-solid fa-plus"></i> Apply for a Service</button></div>';
      return;
    }

    renderDocumentsList(container, documents);
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Error Loading Documents</h3><p>' + err.message + '</p></div>';
  }
}

function renderDocumentsList(container, documents) {
  var html = '';
  html += '<div class="search-container">';
  html += '<i class="fa-solid fa-magnifying-glass"></i>';
  html += '<input type="text" class="search-input" id="docSearchInput" placeholder="Search documents...">';
  html += '</div>';

  var activeCount = documents.filter(function(d) { return d.status === 'active'; }).length;
  var expiredCount = documents.filter(function(d) { return d.status === 'expired'; }).length;

  html += '<div class="stats-grid">';
  html += '<div class="stat-card"><div class="stat-value">' + documents.length + '</div><div class="stat-label">Total</div></div>';
  html += '<div class="stat-card"><div class="stat-value" style="color:var(--success)">' + activeCount + '</div><div class="stat-label">Active</div></div>';
  html += '<div class="stat-card"><div class="stat-value" style="color:var(--text-muted)">' + expiredCount + '</div><div class="stat-label">Expired</div></div>';
  html += '</div>';
  html += '<div class="doc-list" id="docList">';

  for (var i = 0; i < documents.length; i++) {
    var doc = documents[i];
    var statusClass = 'badge-' + doc.status;
    var docIcon = getDocumentIcon(doc.document_type);

    html += '<div class="doc-item-card" data-search="' + doc.document_name.toLowerCase() + ' ' + doc.document_type + ' ' + doc.status + '">';
    html += '<div class="doc-item-header">';
    html += '<div style="display:flex;align-items:center;gap:12px;">';
    html += '<div style="width:48px;height:48px;border-radius:var(--radius-md);background:linear-gradient(135deg,var(--green),var(--green-dark));display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">';
    html += '<i class="fa-solid ' + docIcon + '"></i></div>';
    html += '<div><div class="doc-item-title">' + doc.document_name + '</div>';
    html += '<div class="doc-item-meta">';
    html += '<span><i class="fa-regular fa-calendar"></i> Issued: ' + formatDate(doc.issued_date) + '</span>';
    if (doc.document_number) html += '<span><i class="fa-solid fa-hashtag"></i> ' + doc.document_number + '</span>';
    html += '</div></div></div>';
    html += '<span class="badge ' + statusClass + '">' + doc.status + '</span>';
    html += '</div>';

    if (doc.valid_until) {
      html += '<div style="margin-top:12px;font-size:13px;color:var(--text-secondary);">';
      html += '<i class="fa-solid fa-clock"></i> Valid until: ' + formatDate(doc.valid_until) + '</div>';
    }

    html += '<div style="margin-top:12px;display:flex;gap:8px;">';
    html += '<button class="btn btn-sm btn-outline" onclick="viewDocument(\'' + doc.id + '\')"><i class="fa-solid fa-eye"></i> View</button>';
    html += '<button class="btn btn-sm btn-outline" onclick="downloadDocument(\'' + doc.id + '\')"><i class="fa-solid fa-download"></i> Download</button>';
    html += '</div></div>';
  }

  html += '</div>';
  container.innerHTML = html;

  var searchInput = container.querySelector('#docSearchInput');
  searchInput.addEventListener('input', function(e) {
    var query = e.target.value.toLowerCase();
    container.querySelectorAll('.doc-item-card').forEach(function(card) {
      var searchData = card.dataset.search;
      card.style.display = searchData.includes(query) ? 'block' : 'none';
    });
  });
}

function getDocumentIcon(type) {
  var icons = {
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

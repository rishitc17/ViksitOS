// Citizen My Applications Module

async function initMyApplications(container) {
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading applications...</p></div>';

  try {
    var { data: applications, error } = await window.ViksitOS.supabase
      .from('applications')
      .select('*')
      .eq('citizen_id', userProfile.id)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    if (!applications || applications.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-folder-open"></i><h3>No Applications Yet</h3><p>Apply for services to see them here</p><button class="btn btn-primary mt-2" onclick="openApp(\'apply\')"><i class="fa-solid fa-plus"></i> Apply Now</button></div>';
      return;
    }

    renderApplicationsList(container, applications);
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Error Loading Applications</h3><p>' + err.message + '</p></div>';
  }
}

function renderApplicationsList(container, applications) {
  var html = '';
  html += '<div class="search-container">';
  html += '<i class="fa-solid fa-magnifying-glass"></i>';
  html += '<input type="text" class="search-input" id="appSearchInput" placeholder="Search applications...">';
  html += '</div>';

  var pendingCount = applications.filter(function(a) { return a.status === 'pending'; }).length;
  var approvedCount = applications.filter(function(a) { return a.status === 'approved'; }).length;
  var rejectedCount = applications.filter(function(a) { return a.status === 'rejected'; }).length;

  html += '<div class="stats-grid">';
  html += '<div class="stat-card"><div class="stat-value">' + applications.length + '</div><div class="stat-label">Total</div></div>';
  html += '<div class="stat-card"><div class="stat-value" style="color:var(--warning)">' + pendingCount + '</div><div class="stat-label">Pending</div></div>';
  html += '<div class="stat-card"><div class="stat-value" style="color:var(--success)">' + approvedCount + '</div><div class="stat-label">Approved</div></div>';
  html += '<div class="stat-card"><div class="stat-value" style="color:var(--error)">' + rejectedCount + '</div><div class="stat-label">Rejected</div></div>';
  html += '</div>';
  html += '<div class="app-list" id="appList">';

  for (var i = 0; i < applications.length; i++) {
    var app = applications[i];
    var statusClass = 'badge-' + app.status;
    var statusIcon = app.status === 'approved' ? 'fa-circle-check' : app.status === 'rejected' ? 'fa-circle-xmark' : 'fa-clock';

    html += '<div class="app-item-card" data-search="' + app.service_name.toLowerCase() + ' ' + app.status + '">';
    html += '<div class="app-item-header">';
    html += '<div><div class="app-item-title">' + app.service_name + '</div>';
    html += '<div class="app-item-meta">';
    html += '<span><i class="fa-regular fa-calendar"></i> ' + formatDate(app.submitted_at) + '</span>';
    html += '<span><i class="fa-solid fa-hashtag"></i> ' + app.id.slice(0, 8).toUpperCase() + '</span>';
    html += '</div></div>';
    html += '<span class="badge ' + statusClass + '"><i class="fa-solid ' + statusIcon + '"></i> ' + app.status + '</span>';
    html += '</div>';

    if (app.status === 'rejected' && app.rejection_reason) {
      html += '<div style="margin-top:12px;padding:12px;background:rgba(230,57,70,0.1);border-radius:var(--radius-sm);font-size:13px;">';
      html += '<strong><i class="fa-solid fa-circle-info"></i> Rejection Reason:</strong>';
      html += '<p style="margin-top:4px;">' + app.rejection_reason + '</p></div>';
    }

    if (app.status === 'approved' && app.reviewed_at) {
      html += '<div style="margin-top:12px;padding:12px;background:rgba(19,136,8,0.1);border-radius:var(--radius-sm);font-size:13px;">';
      html += '<strong><i class="fa-solid fa-circle-check"></i> Approved on:</strong> ' + formatDate(app.reviewed_at) + '</div>';
    }

    html += '</div>';
  }

  html += '</div>';
  container.innerHTML = html;

  var searchInput = container.querySelector('#appSearchInput');
  searchInput.addEventListener('input', function(e) {
    var query = e.target.value.toLowerCase();
    container.querySelectorAll('.app-item-card').forEach(function(card) {
      var searchData = card.dataset.search;
      card.style.display = searchData.includes(query) ? 'block' : 'none';
    });
  });
}

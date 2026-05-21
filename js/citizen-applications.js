// Citizen My Applications Module

async function initMyApplications(container) {
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading applications...</p></div>';

  try {
    const { data: applications, error } = await supabase
      .from('applications')
      .select('*')
      .eq('citizen_id', userProfile.id)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    if (!applications || applications.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-folder-open"></i>
          <h3>No Applications Yet</h3>
          <p>Apply for services to see them here</p>
          <button class="btn btn-primary mt-2" onclick="openApp('apply')">
            <i class="fa-solid fa-plus"></i> Apply Now
          </button>
        </div>
      `;
      return;
    }

    renderApplicationsList(container, applications);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-circle-exclamation"></i>
        <h3>Error Loading Applications</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

function renderApplicationsList(container, applications) {
  let html = `
    <div class="search-container">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input type="text" class="search-input" id="appSearchInput" placeholder="Search applications...">
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${applications.length}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--warning)">${applications.filter(a => a.status === 'pending').length}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--success)">${applications.filter(a => a.status === 'approved').length}</div>
        <div class="stat-label">Approved</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--error)">${applications.filter(a => a.status === 'rejected').length}</div>
        <div class="stat-label">Rejected</div>
      </div>
    </div>
    <div class="app-list" id="appList">
  `;

  for (const app of applications) {
    const statusClass = `badge-${app.status}`;
    const statusIcon = app.status === 'approved' ? 'fa-circle-check' : 
                       app.status === 'rejected' ? 'fa-circle-xmark' : 'fa-clock';

    html += `
      <div class="app-item-card" data-search="${app.service_name.toLowerCase()} ${app.status}">
        <div class="app-item-header">
          <div>
            <div class="app-item-title">${app.service_name}</div>
            <div class="app-item-meta">
              <span><i class="fa-regular fa-calendar"></i> ${formatDate(app.submitted_at)}</span>
              <span><i class="fa-solid fa-hashtag"></i> ${app.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
          <span class="badge ${statusClass}">
            <i class="fa-solid ${statusIcon}"></i> ${app.status}
          </span>
        </div>
    `;

    if (app.status === 'rejected' && app.rejection_reason) {
      html += `
        <div style="margin-top:12px;padding:12px;background:rgba(230,57,70,0.1);border-radius:var(--radius-sm);font-size:13px;">
          <strong><i class="fa-solid fa-circle-info"></i> Rejection Reason:</strong>
          <p style="margin-top:4px;">${app.rejection_reason}</p>
        </div>
      `;
    }

    if (app.status === 'approved' && app.reviewed_at) {
      html += `
        <div style="margin-top:12px;padding:12px;background:rgba(19,136,8,0.1);border-radius:var(--radius-sm);font-size:13px;">
          <strong><i class="fa-solid fa-circle-check"></i> Approved on:</strong> ${formatDate(app.reviewed_at)}
        </div>
      `;
    }

    html += `</div>`;
  }

  html += `</div>`;
  container.innerHTML = html;

  // Search functionality
  const searchInput = container.querySelector('#appSearchInput');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    container.querySelectorAll('.app-item-card').forEach(card => {
      const searchData = card.dataset.search;
      card.style.display = searchData.includes(query) ? 'block' : 'none';
    });
  });
}

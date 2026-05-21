// Government Interface
const supabase = window.ViksitOS ? window.ViksitOS.supabase : null;

let govtProfile = null;
let currentPage = 'dashboard';

document.addEventListener('DOMContentLoaded', async () => {
  if (!initSupabase()) {
    window.location.href = '/ViksitOS/pages/login.html';
    return;
  }

  govtProfile = await requireAuth('government');
  if (!govtProfile) return;

  // Set user info
  document.getElementById('userName').textContent = govtProfile.full_name;
  document.getElementById('userAvatar').textContent = govtProfile.first_name.charAt(0).toUpperCase();
  document.getElementById('userDept').textContent = govtProfile.department || 'Government';
  document.getElementById('welcomeText').textContent = `Welcome, ${govtProfile.first_name}!`;

  // Theme toggle
  initGovtTheme();

  // Sidebar navigation
  initSidebar();

  // Load dashboard
  await loadDashboard();

  // Load pending count
  await loadPendingCount();
});

function initGovtTheme() {
  const savedTheme = localStorage.getItem('viksitos_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateGovtThemeIcon(savedTheme);

  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('viksitos_theme', next);
    updateGovtThemeIcon(next);
  });
}

function updateGovtThemeIcon(theme) {
  const icon = document.querySelector('#themeToggle i');
  icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function initSidebar() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarClose = document.getElementById('sidebarClose');
  const navItems = document.querySelectorAll('.nav-item');

  menuToggle.addEventListener('click', () => {
    sidebar.classList.add('active');
  });

  sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('active');
  });

  // Close sidebar on overlay click (mobile)
  document.getElementById('notifOverlay').addEventListener('click', () => {
    sidebar.classList.remove('active');
    document.getElementById('notifPanel').classList.remove('active');
    document.getElementById('notifOverlay').classList.remove('active');
  });

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateToPage(page);
      
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      
      // Close sidebar on mobile
      sidebar.classList.remove('active');
    });
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    logout();
  });

  // Notification panel
  const notifBtn = document.getElementById('notifBtn');
  const notifPanel = document.getElementById('notifPanel');
  const notifOverlay = document.getElementById('notifOverlay');

  notifBtn.addEventListener('click', () => {
    notifPanel.classList.toggle('active');
    notifOverlay.classList.toggle('active');
  });
}

async function navigateToPage(page) {
  currentPage = page;
  
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  
  // Show target page
  const targetPage = document.getElementById(`${page}Page`);
  if (targetPage) {
    targetPage.classList.remove('hidden');
  }

  // Update title
  const titles = {
    dashboard: 'Dashboard',
    applications: 'Applications',
    documents: 'Documents'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

  // Load page content
  switch (page) {
    case 'dashboard':
      await loadDashboard();
      break;
    case 'applications':
      await loadApplications();
      break;
    case 'documents':
      await loadDocuments();
      break;
  }
}

async function loadDashboard() {
  try {
    // Fetch all applications for stats
    const { data: applications, error } = await supabase
      .from('applications')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    const pending = applications?.filter(a => a.status === 'pending').length || 0;
    const approved = applications?.filter(a => a.status === 'approved').length || 0;
    const rejected = applications?.filter(a => a.status === 'rejected').length || 0;

    document.getElementById('statPending').textContent = pending;
    document.getElementById('statApproved').textContent = approved;
    document.getElementById('statRejected').textContent = rejected;

    // Calculate average review time
    const reviewed = applications?.filter(a => a.reviewed_at && a.submitted_at) || [];
    let totalHours = 0;
    for (const app of reviewed) {
      const submitted = new Date(app.submitted_at);
      const reviewed = new Date(app.reviewed_at);
      totalHours += (reviewed - submitted) / 3600000;
    }
    const avgTime = reviewed.length > 0 ? (totalHours / reviewed.length).toFixed(1) : '-';
    document.getElementById('statAvgTime').textContent = avgTime;

    // Render chart
    renderChart(applications || []);

    // Recent applications
    renderRecentApplications(applications?.slice(0, 5) || []);

  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

function renderChart(applications) {
  const container = document.getElementById('applicationsChart');
  
  // Group by last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      count: 0
    });
  }

  for (const app of applications) {
    const appDate = new Date(app.submitted_at).toISOString().split('T')[0];
    const day = days.find(d => d.date === appDate);
    if (day) day.count++;
  }

  const maxCount = Math.max(...days.map(d => d.count), 1);

  let html = '';
  for (const day of days) {
    const height = (day.count / maxCount) * 180;
    html += `
      <div class="chart-bar" style="height:${Math.max(height, 20)}px;">
        <span class="chart-value">${day.count}</span>
        <span class="chart-label">${day.label}</span>
      </div>
    `;
  }

  container.innerHTML = html;
}

function renderRecentApplications(applications) {
  const container = document.getElementById('recentAppsList');

  if (applications.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:30px;">
        <i class="fa-solid fa-folder-open"></i>
        <h3>No Applications Yet</h3>
      </div>
    `;
    return;
  }

  let html = '';
  for (const app of applications) {
    const statusClass = `badge-${app.status}`;
    html += `
      <div class="govt-app-card" style="margin-bottom:12px;">
        <div class="govt-app-header">
          <div class="govt-app-info">
            <h4>${app.service_name}</h4>
            <p>Application ID: ${app.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <span class="badge ${statusClass}">${app.status}</span>
        </div>
        <div class="govt-app-meta">
          <span><i class="fa-regular fa-calendar"></i> ${formatDate(app.submitted_at)}</span>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

async function loadPendingCount() {
  try {
    const { count, error } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;

    const badge = document.getElementById('pendingBadge');
    badge.textContent = count || 0;
    badge.style.display = count > 0 ? 'block' : 'none';
  } catch (err) {
    console.error('Error loading pending count:', err);
  }
}

async function loadApplications() {
  const container = document.getElementById('govtAppList');
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading applications...</p></div>';

  try {
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        citizen:profiles!applications_citizen_id_fkey(full_name, email)
      `)
      .order('submitted_at', { ascending: true });

    if (error) throw error;

    renderGovtApplications(container, applications || []);
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

function renderGovtApplications(container, applications) {
  const searchInput = document.getElementById('govtAppSearch');
  const statusFilter = document.getElementById('statusFilter');

  function filterAndRender() {
    const query = searchInput.value.toLowerCase();
    const status = statusFilter.value;

    let filtered = applications;

    if (status !== 'all') {
      filtered = filtered.filter(a => a.status === status);
    }

    if (query) {
      filtered = filtered.filter(a => 
        a.service_name.toLowerCase().includes(query) ||
        a.citizen?.full_name?.toLowerCase().includes(query) ||
        a.id.toLowerCase().includes(query)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-folder-open"></i>
          <h3>No Applications Found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      `;
      return;
    }

    let html = '';
    for (const app of filtered) {
      const statusClass = `badge-${app.status}`;
      const statusIcon = app.status === 'approved' ? 'fa-circle-check' : 
                         app.status === 'rejected' ? 'fa-circle-xmark' : 'fa-clock';

      html += `
        <div class="govt-app-card">
          <div class="govt-app-header">
            <div class="govt-app-info">
              <h4>${app.service_name}</h4>
              <p>${app.citizen?.full_name || 'Unknown'} - ${app.citizen?.email || ''}</p>
              <div class="govt-app-meta">
                <span><i class="fa-regular fa-calendar"></i> ${formatDate(app.submitted_at)}</span>
                <span><i class="fa-solid fa-hashtag"></i> ${app.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
            <span class="badge ${statusClass}">
              <i class="fa-solid ${statusIcon}"></i> ${app.status}
            </span>
          </div>
          ${app.status === 'pending' ? `
            <div class="govt-app-actions">
              <button class="btn btn-secondary btn-sm" onclick="openReviewModal('${app.id}', 'approve')">
                <i class="fa-solid fa-check"></i> Approve
              </button>
              <button class="btn btn-danger btn-sm" onclick="openReviewModal('${app.id}', 'reject')">
                <i class="fa-solid fa-xmark"></i> Reject
              </button>
              <button class="btn btn-outline btn-sm" onclick="viewApplicationDetails('${app.id}')">
                <i class="fa-solid fa-eye"></i> View Details
              </button>
            </div>
          ` : `
            ${app.rejection_reason ? `
              <div style="margin-top:12px;padding:12px;background:rgba(230,57,70,0.1);border-radius:var(--radius-sm);font-size:13px;">
                <strong>Rejection Reason:</strong> ${app.rejection_reason}
              </div>
            ` : ''}
            ${app.reviewed_at ? `
              <div style="margin-top:12px;font-size:12px;color:var(--text-muted);">
                Reviewed on: ${formatDate(app.reviewed_at)}
              </div>
            ` : ''}
          `}
        </div>
      `;
    }

    container.innerHTML = html;
  }

  searchInput.addEventListener('input', filterAndRender);
  statusFilter.addEventListener('change', filterAndRender);
  filterAndRender();
}

async function openReviewModal(appId, action) {
  const modal = document.getElementById('reviewModal');
  const content = document.getElementById('reviewModalContent');
  const title = document.getElementById('reviewModalTitle');

  try {
    const { data: app, error } = await supabase
      .from('applications')
      .select(`
        *,
        citizen:profiles!applications_citizen_id_fkey(full_name, email)
      `)
      .eq('id', appId)
      .single();

    if (error) throw error;

    title.textContent = action === 'approve' ? 'Approve Application' : 'Reject Application';

    let formDataHtml = '';
    if (app.form_data && typeof app.form_data === 'object') {
      for (const [key, value] of Object.entries(app.form_data)) {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        formDataHtml += `
          <div class="detail-row">
            <span class="label">${label}</span>
            <span class="value">${value}</span>
          </div>
        `;
      }
    }

    content.innerHTML = `
      <div class="application-details">
        <h4>Application Details</h4>
        <div class="detail-row">
          <span class="label">Service</span>
          <span class="value">${app.service_name}</span>
        </div>
        <div class="detail-row">
          <span class="label">Applicant</span>
          <span class="value">${app.citizen?.full_name}</span>
        </div>
        <div class="detail-row">
          <span class="label">Submitted</span>
          <span class="value">${formatDate(app.submitted_at)}</span>
        </div>
        ${formDataHtml}
      </div>
      ${action === 'reject' ? `
        <div class="reject-reason">
          <label class="form-label">Rejection Reason <span style="color:var(--error)">*</span></label>
          <textarea class="form-textarea" id="rejectionReason" placeholder="Provide a reason for rejection..." required></textarea>
        </div>
      ` : `
        <p style="color:var(--text-secondary);font-size:14px;">
          <i class="fa-solid fa-circle-info"></i> 
          Approving this application will notify the citizen. You can proceed to create a document after approval.
        </p>
      `}
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeReviewModal()">Cancel</button>
        <button class="btn ${action === 'approve' ? 'btn-secondary' : 'btn-danger'}" onclick="submitReview('${appId}', '${action}')">
          <i class="fa-solid ${action === 'approve' ? 'fa-check' : 'fa-xmark'}"></i>
          ${action === 'approve' ? 'Approve' : 'Reject'}
        </button>
      </div>
    `;

    modal.classList.add('active');
  } catch (err) {
    showToast('Error loading application: ' + err.message, 'error');
  }
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('reviewModalClose').addEventListener('click', closeReviewModal);
  document.getElementById('reviewModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('reviewModal')) closeReviewModal();
  });
});

async function submitReview(appId, action) {
  const rejectionReason = document.getElementById('rejectionReason')?.value || null;

  if (action === 'reject' && !rejectionReason) {
    showToast('Please provide a rejection reason', 'error');
    return;
  }

  try {
    // Get application first to get citizen_id
    const { data: app } = await supabase
      .from('applications')
      .select('citizen_id, service_name')
      .eq('id', appId)
      .single();

    // Update application
    const { error } = await supabase
      .from('applications')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: govtProfile.id
      })
      .eq('id', appId);

    if (error) throw error;

    // Create notification for citizen
    await supabase
      .from('notifications')
      .insert([{
        user_id: app.citizen_id,
        title: action === 'approve' ? 'Application Approved' : 'Application Rejected',
        message: action === 'approve' 
          ? `Your ${app.service_name} application has been approved.`
          : `Your ${app.service_name} application was rejected. Reason: ${rejectionReason}`,
        type: 'application',
        app_source: 'applications',
        redirect_url: 'applications'
      }]);

    // If approved, prompt to create document
    if (action === 'approve') {
      showToast('Application approved!', 'success');
      closeReviewModal();
      
      // Create document for approved application
      await createDocumentFromApplication(app);
    } else {
      showToast('Application rejected', 'warning');
      closeReviewModal();
    }

    // Reload applications
    await loadApplications();
    await loadPendingCount();
    await loadDashboard();

  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function createDocumentFromApplication(app) {
  const docType = app.service_type;
  const docName = app.service_name;
  
  // Generate document number
  const docNumber = `VIK-${Date.now().toString(36).toUpperCase()}`;

  try {
    await supabase
      .from('documents')
      .insert([{
        citizen_id: app.citizen_id,
        document_type: docType,
        document_name: docName,
        document_number: docNumber,
        issued_date: new Date().toISOString().split('T')[0],
        status: 'active',
        metadata: { application_id: app.id, form_data: app.form_data }
      }]);

    // Notify citizen about new document
    await supabase
      .from('notifications')
      .insert([{
        user_id: app.citizen_id,
        title: 'Document Issued',
        message: `Your ${docName} has been issued. View it in Documents.`,
        type: 'document',
        app_source: 'documents',
        redirect_url: 'documents'
      }]);

    showToast('Document created and citizen notified', 'success');
  } catch (err) {
    console.error('Error creating document:', err);
  }
}

function viewApplicationDetails(appId) {
  openReviewModal(appId, 'view');
  document.getElementById('reviewModalTitle').textContent = 'Application Details';
  
  // Remove action buttons for view mode
  const actions = document.querySelector('.modal-actions');
  if (actions) {
    actions.innerHTML = `
      <button class="btn btn-outline w-full" onclick="closeReviewModal()">Close</button>
    `;
  }
}

async function loadDocuments() {
  const container = document.getElementById('govtDocList');
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading documents...</p></div>';

  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        *,
        citizen:profiles!documents_citizen_id_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    renderGovtDocuments(container, documents || []);
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

function renderGovtDocuments(container, documents) {
  const searchInput = document.getElementById('govtDocSearch');

  function filterAndRender() {
    const query = searchInput.value.toLowerCase();

    let filtered = documents;
    if (query) {
      filtered = filtered.filter(d => 
        d.document_name.toLowerCase().includes(query) ||
        d.document_type.toLowerCase().includes(query) ||
        d.citizen?.full_name?.toLowerCase().includes(query) ||
        d.document_number?.toLowerCase().includes(query)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-file-shield"></i>
          <h3>No Documents Found</h3>
          <p>Try adjusting your search</p>
        </div>
      `;
      return;
    }

    let html = '';
    for (const doc of filtered) {
      const statusClass = `badge-${doc.status}`;
      const docIcon = getDocumentIcon(doc.document_type);

      html += `
        <div class="govt-doc-card">
          <div class="govt-doc-header">
            <div class="govt-doc-icon">
              <i class="fa-solid ${docIcon}"></i>
            </div>
            <div class="govt-doc-info">
              <h4>${doc.document_name}</h4>
              <p>${doc.citizen?.full_name || 'Unknown'} - ${doc.citizen?.email || ''}</p>
            </div>
            <span class="badge ${statusClass}" style="margin-left:auto;">${doc.status}</span>
          </div>
          <div class="govt-doc-meta">
            <span><i class="fa-solid fa-hashtag"></i> ${doc.document_number || 'N/A'}</span>
            <span><i class="fa-regular fa-calendar"></i> Issued: ${formatDate(doc.issued_date)}</span>
            ${doc.valid_until ? `<span><i class="fa-solid fa-clock"></i> Valid until: ${formatDate(doc.valid_until)}</span>` : ''}
          </div>
          <div class="govt-doc-actions">
            <button class="btn btn-sm btn-outline" onclick="openEditDocModal('${doc.id}')">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline" onclick="viewDocument('${doc.id}')">
              <i class="fa-solid fa-eye"></i> View
            </button>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  searchInput.addEventListener('input', filterAndRender);
  filterAndRender();
}

async function openEditDocModal(docId) {
  const modal = document.getElementById('editDocModal');
  const content = document.getElementById('editDocModalContent');

  try {
    const { data: doc, error } = await supabase
      .from('documents')
      .select(`
        *,
        citizen:profiles!documents_citizen_id_fkey(full_name, email)
      `)
      .eq('id', docId)
      .single();

    if (error) throw error;

    content.innerHTML = `
      <div class="application-details">
        <h4>Document Details</h4>
        <div class="detail-row">
          <span class="label">Document</span>
          <span class="value">${doc.document_name}</span>
        </div>
        <div class="detail-row">
          <span class="label">Owner</span>
          <span class="value">${doc.citizen?.full_name}</span>
        </div>
        <div class="detail-row">
          <span class="label">Number</span>
          <span class="value">${doc.document_number || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status</span>
          <span class="value"><span class="badge badge-${doc.status}">${doc.status}</span></span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Update Status</label>
        <select class="form-select" id="docStatus">
          <option value="active" ${doc.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="expired" ${doc.status === 'expired' ? 'selected' : ''}>Expired</option>
          <option value="revoked" ${doc.status === 'revoked' ? 'selected' : ''}>Revoked</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Valid Until (optional)</label>
        <input type="date" class="form-input" id="docValidUntil" value="${doc.valid_until || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Reason for Change <span style="color:var(--error)">*</span></label>
        <textarea class="form-textarea" id="docChangeReason" placeholder="Provide a reason for this change..." required></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeEditDocModal()">Cancel</button>
        <button class="btn btn-navy" onclick="submitDocEdit('${docId}', '${doc.citizen_id}', '${doc.document_name}')">
          <i class="fa-solid fa-save"></i> Save Changes
        </button>
      </div>
    `;

    modal.classList.add('active');
  } catch (err) {
    showToast('Error loading document: ' + err.message, 'error');
  }
}

function closeEditDocModal() {
  document.getElementById('editDocModal').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('editDocModalClose').addEventListener('click', closeEditDocModal);
  document.getElementById('editDocModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('editDocModal')) closeEditDocModal();
  });
});

async function submitDocEdit(docId, citizenId, docName) {
  const status = document.getElementById('docStatus').value;
  const validUntil = document.getElementById('docValidUntil').value || null;
  const reason = document.getElementById('docChangeReason').value;

  if (!reason) {
    showToast('Please provide a reason for the change', 'error');
    return;
  }

  try {
    await supabase
      .from('documents')
      .update({
        status,
        valid_until: validUntil,
        updated_at: new Date().toISOString()
      })
      .eq('id', docId);

    // Notify citizen
    await supabase
      .from('notifications')
      .insert([{
        user_id: citizenId,
        title: 'Document Updated',
        message: `Your ${docName} has been updated. Reason: ${reason}`,
        type: 'document',
        app_source: 'documents',
        redirect_url: 'documents'
      }]);

    showToast('Document updated and citizen notified', 'success');
    closeEditDocModal();
    await loadDocuments();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

function viewDocument(docId) {
  showToast('Document viewer coming soon', 'info');
}

// Government Interface

var govtProfile = null;
var currentPage = 'dashboard';

document.addEventListener('DOMContentLoaded', async function() {
  if (!window.ViksitOS.auth.initSupabase()) {
    window.location.href = '/ViksitOS/pages/login.html';
    return;
  }

  govtProfile = await window.ViksitOS.auth.requireAuth('government');
  if (!govtProfile) return;

  document.getElementById('userName').textContent = govtProfile.full_name;
  document.getElementById('userAvatar').textContent = govtProfile.first_name.charAt(0).toUpperCase();
  document.getElementById('userDept').textContent = govtProfile.department || 'Government';
  document.getElementById('welcomeText').textContent = 'Welcome, ' + govtProfile.first_name + '!';

  initGovtTheme();
  initSidebar();
  await loadDashboard();
  await loadPendingCount();
});

function initGovtTheme() {
  var savedTheme = localStorage.getItem('viksitos_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateGovtThemeIcon(savedTheme);

  document.getElementById('themeToggle').addEventListener('click', function() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('viksitos_theme', next);
    updateGovtThemeIcon(next);
  });
}

function updateGovtThemeIcon(theme) {
  var icon = document.querySelector('#themeToggle i');
  icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function initSidebar() {
  var menuToggle = document.getElementById('menuToggle');
  var sidebar = document.getElementById('sidebar');
  var sidebarClose = document.getElementById('sidebarClose');
  var navItems = document.querySelectorAll('.nav-item');

  menuToggle.addEventListener('click', function() {
    sidebar.classList.add('active');
  });

  sidebarClose.addEventListener('click', function() {
    sidebar.classList.remove('active');
  });

  document.getElementById('notifOverlay').addEventListener('click', function() {
    sidebar.classList.remove('active');
    document.getElementById('notifPanel').classList.remove('active');
    document.getElementById('notifOverlay').classList.remove('active');
  });

  navItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      var page = item.dataset.page;
      navigateToPage(page);
      navItems.forEach(function(n) { n.classList.remove('active'); });
      item.classList.add('active');
      sidebar.classList.remove('active');
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', function() {
    logout();
  });

  var notifBtn = document.getElementById('notifBtn');
  var notifPanel = document.getElementById('notifPanel');
  var notifOverlay = document.getElementById('notifOverlay');

  notifBtn.addEventListener('click', function() {
    notifPanel.classList.toggle('active');
    notifOverlay.classList.toggle('active');
  });
}

async function navigateToPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(function(p) { p.classList.add('hidden'); });
  var targetPage = document.getElementById(page + 'Page');
  if (targetPage) targetPage.classList.remove('hidden');

  var titles = { dashboard: 'Dashboard', applications: 'Applications', documents: 'Documents' };
  document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

  if (page === 'dashboard') await loadDashboard();
  else if (page === 'applications') await loadApplications();
  else if (page === 'documents') await loadDocuments();
}

async function loadDashboard() {
  try {
    var { data: applications, error } = await window.ViksitOS.supabase
      .from('applications')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    var pending = applications ? applications.filter(function(a) { return a.status === 'pending'; }).length : 0;
    var approved = applications ? applications.filter(function(a) { return a.status === 'approved'; }).length : 0;
    var rejected = applications ? applications.filter(function(a) { return a.status === 'rejected'; }).length : 0;

    document.getElementById('statPending').textContent = pending;
    document.getElementById('statApproved').textContent = approved;
    document.getElementById('statRejected').textContent = rejected;

    var reviewed = applications ? applications.filter(function(a) { return a.reviewed_at && a.submitted_at; }) : [];
    var totalHours = 0;
    reviewed.forEach(function(app) {
      totalHours += (new Date(app.reviewed_at) - new Date(app.submitted_at)) / 3600000;
    });
    var avgTime = reviewed.length > 0 ? (totalHours / reviewed.length).toFixed(1) : '-';
    document.getElementById('statAvgTime').textContent = avgTime;

    renderChart(applications || []);
    renderRecentApplications(applications ? applications.slice(0, 5) : []);
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

function renderChart(applications) {
  var container = document.getElementById('applicationsChart');
  var days = [];
  for (var i = 6; i >= 0; i--) {
    var date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      count: 0
    });
  }

  applications.forEach(function(app) {
    var appDate = new Date(app.submitted_at).toISOString().split('T')[0];
    var day = days.find(function(d) { return d.date === appDate; });
    if (day) day.count++;
  });

  var maxCount = Math.max.apply(null, days.map(function(d) { return d.count; }).concat([1]));
  var html = '';
  days.forEach(function(day) {
    var height = (day.count / maxCount) * 180;
    html += '<div class="chart-bar" style="height:' + Math.max(height, 20) + 'px;">';
    html += '<span class="chart-value">' + day.count + '</span>';
    html += '<span class="chart-label">' + day.label + '</span></div>';
  });
  container.innerHTML = html;
}

function renderRecentApplications(applications) {
  var container = document.getElementById('recentAppsList');
  if (applications.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:30px;"><i class="fa-solid fa-folder-open"></i><h3>No Applications Yet</h3></div>';
    return;
  }

  var html = '';
  applications.forEach(function(app) {
    var statusClass = 'badge-' + app.status;
    html += '<div class="govt-app-card" style="margin-bottom:12px;">';
    html += '<div class="govt-app-header">';
    html += '<div class="govt-app-info"><h4>' + app.service_name + '</h4>';
    html += '<p>Application ID: ' + app.id.slice(0, 8).toUpperCase() + '</p></div>';
    html += '<span class="badge ' + statusClass + '">' + app.status + '</span></div>';
    html += '<div class="govt-app-meta"><span><i class="fa-regular fa-calendar"></i> ' + formatDate(app.submitted_at) + '</span></div></div>';
  });
  container.innerHTML = html;
}

async function loadPendingCount() {
  try {
    var { count, error } = await window.ViksitOS.supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;
    var badge = document.getElementById('pendingBadge');
    badge.textContent = count || 0;
    badge.style.display = count > 0 ? 'block' : 'none';
  } catch (err) {
    console.error('Error loading pending count:', err);
  }
}

async function loadApplications() {
  var container = document.getElementById('govtAppList');
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading applications...</p></div>';

  try {
    var { data: applications, error } = await window.ViksitOS.supabase
      .from('applications')
      .select('*, citizen:profiles!applications_citizen_id_fkey(full_name, email)')
      .order('submitted_at', { ascending: true });

    if (error) throw error;
    renderGovtApplications(container, applications || []);
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Error Loading Applications</h3><p>' + err.message + '</p></div>';
  }
}

function renderGovtApplications(container, applications) {
  var searchInput = document.getElementById('govtAppSearch');
  var statusFilter = document.getElementById('statusFilter');

  function filterAndRender() {
    var query = searchInput.value.toLowerCase();
    var status = statusFilter.value;

    var filtered = applications;
    if (status !== 'all') filtered = filtered.filter(function(a) { return a.status === status; });
    if (query) filtered = filtered.filter(function(a) {
      return (a.service_name && a.service_name.toLowerCase().includes(query)) ||
             (a.citizen && a.citizen.full_name && a.citizen.full_name.toLowerCase().includes(query)) ||
             (a.id && a.id.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-folder-open"></i><h3>No Applications Found</h3><p>Try adjusting your search or filters</p></div>';
      return;
    }

    var html = '';
    filtered.forEach(function(app) {
      var statusClass = 'badge-' + app.status;
      var statusIcon = app.status === 'approved' ? 'fa-circle-check' : app.status === 'rejected' ? 'fa-circle-xmark' : 'fa-clock';

      html += '<div class="govt-app-card">';
      html += '<div class="govt-app-header">';
      html += '<div class="govt-app-info"><h4>' + app.service_name + '</h4>';
      html += '<p>' + (app.citizen ? app.citizen.full_name : 'Unknown') + ' - ' + (app.citizen ? app.citizen.email : '') + '</p>';
      html += '<div class="govt-app-meta"><span><i class="fa-regular fa-calendar"></i> ' + formatDate(app.submitted_at) + '</span>';
      html += '<span><i class="fa-solid fa-hashtag"></i> ' + app.id.slice(0, 8).toUpperCase() + '</span></div></div>';
      html += '<span class="badge ' + statusClass + '"><i class="fa-solid ' + statusIcon + '"></i> ' + app.status + '</span></div>';

      if (app.status === 'pending') {
        html += '<div class="govt-app-actions">';
        html += '<button class="btn btn-secondary btn-sm" onclick="openReviewModal(\'' + app.id + '\', \'approve\')"><i class="fa-solid fa-check"></i> Approve</button>';
        html += '<button class="btn btn-danger btn-sm" onclick="openReviewModal(\'' + app.id + '\', \'reject\')"><i class="fa-solid fa-xmark"></i> Reject</button>';
        html += '<button class="btn btn-outline btn-sm" onclick="viewApplicationDetails(\'' + app.id + '\')"><i class="fa-solid fa-eye"></i> View Details</button></div>';
      } else {
        if (app.rejection_reason) html += '<div style="margin-top:12px;padding:12px;background:rgba(230,57,70,0.1);border-radius:var(--radius-sm);font-size:13px;"><strong>Rejection Reason:</strong> ' + app.rejection_reason + '</div>';
        if (app.reviewed_at) html += '<div style="margin-top:12px;font-size:12px;color:var(--text-muted);">Reviewed on: ' + formatDate(app.reviewed_at) + '</div>';
      }
      html += '</div>';
    });
    container.innerHTML = html;
  }

  searchInput.addEventListener('input', filterAndRender);
  statusFilter.addEventListener('change', filterAndRender);
  filterAndRender();
}

async function openReviewModal(appId, action) {
  var modal = document.getElementById('reviewModal');
  var content = document.getElementById('reviewModalContent');
  var title = document.getElementById('reviewModalTitle');

  try {
    var { data: app, error } = await window.ViksitOS.supabase
      .from('applications')
      .select('*, citizen:profiles!applications_citizen_id_fkey(full_name, email)')
      .eq('id', appId)
      .single();

    if (error) throw error;

    title.textContent = action === 'approve' ? 'Approve Application' : 'Reject Application';

    var formDataHtml = '';
    if (app.form_data && typeof app.form_data === 'object') {
      for (var key in app.form_data) {
        var label = key.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
        formDataHtml += '<div class="detail-row"><span class="label">' + label + '</span><span class="value">' + app.form_data[key] + '</span></div>';
      }
    }

    var innerHtml = '<div class="application-details"><h4>Application Details</h4>';
    innerHtml += '<div class="detail-row"><span class="label">Service</span><span class="value">' + app.service_name + '</span></div>';
    innerHtml += '<div class="detail-row"><span class="label">Applicant</span><span class="value">' + (app.citizen ? app.citizen.full_name : '') + '</span></div>';
    innerHtml += '<div class="detail-row"><span class="label">Submitted</span><span class="value">' + formatDate(app.submitted_at) + '</span></div>';
    innerHtml += formDataHtml + '</div>';

    if (action === 'reject') {
      innerHtml += '<div class="reject-reason"><label class="form-label">Rejection Reason <span style="color:var(--error)">*</span></label>';
      innerHtml += '<textarea class="form-textarea" id="rejectionReason" placeholder="Provide a reason for rejection..." required></textarea></div>';
    } else {
      innerHtml += '<p style="color:var(--text-secondary);font-size:14px;"><i class="fa-solid fa-circle-info"></i> Approving this application will notify the citizen. You can proceed to create a document after approval.</p>';
    }

    innerHtml += '<div class="modal-actions">';
    innerHtml += '<button class="btn btn-outline" onclick="closeReviewModal()">Cancel</button>';
    innerHtml += '<button class="btn ' + (action === 'approve' ? 'btn-secondary' : 'btn-danger') + '" onclick="submitReview(\'' + appId + '\', \'' + action + '\')">';
    innerHtml += '<i class="fa-solid ' + (action === 'approve' ? 'fa-check' : 'fa-xmark') + '"></i> ' + (action === 'approve' ? 'Approve' : 'Reject') + '</button></div>';

    content.innerHTML = innerHtml;
    modal.classList.add('active');
  } catch (err) {
    showToast('Error loading application: ' + err.message, 'error');
  }
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('reviewModalClose').addEventListener('click', closeReviewModal);
  document.getElementById('reviewModal').addEventListener('click', function(e) {
    if (e.target === document.getElementById('reviewModal')) closeReviewModal();
  });
});

async function submitReview(appId, action) {
  var rejectionReasonEl = document.getElementById('rejectionReason');
  var rejectionReason = rejectionReasonEl ? rejectionReasonEl.value : null;

  if (action === 'reject' && !rejectionReason) {
    showToast('Please provide a rejection reason', 'error');
    return;
  }

  try {
    var { data: app } = await window.ViksitOS.supabase
      .from('applications')
      .select('citizen_id, service_name, service_type, form_data')
      .eq('id', appId)
      .single();

    var { error } = await window.ViksitOS.supabase
      .from('applications')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: govtProfile.id
      })
      .eq('id', appId);

    if (error) throw error;

    await window.ViksitOS.supabase
      .from('notifications')
      .insert([{
        user_id: app.citizen_id,
        title: action === 'approve' ? 'Application Approved' : 'Application Rejected',
        message: action === 'approve' ? 'Your ' + app.service_name + ' application has been approved.' : 'Your ' + app.service_name + ' application was rejected. Reason: ' + rejectionReason,
        type: 'application',
        app_source: 'applications',
        redirect_url: 'applications'
      }]);

    if (action === 'approve') {
      showToast('Application approved!', 'success');
      closeReviewModal();
      await createDocumentFromApplication(app);
    } else {
      showToast('Application rejected', 'warning');
      closeReviewModal();
    }

    await loadApplications();
    await loadPendingCount();
    await loadDashboard();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function createDocumentFromApplication(app) {
  var docType = app.service_type;
  var docName = app.service_name;
  var docNumber = 'VIK-' + Date.now().toString(36).toUpperCase();

  if (!window.ViksitOS.supabase) {
    console.error('Supabase not initialized');
    return;
  }

  try {
    var { error: docError } = await window.ViksitOS.supabase
      .from('documents')
      .insert([{
        citizen_id: app.citizen_id,
        document_type: docType,
        document_name: docName,
        document_number: docNumber,
        issued_date: new Date().toISOString().split('T')[0],
        status: 'active',
        metadata: { application_id: app.id }
      }]);

    if (docError) {
      console.error('Document insert error:', docError);
      showToast('Document creation failed: ' + docError.message, 'error');
      return;
    }

    var { error: notifError } = await window.ViksitOS.supabase
      .from('notifications')
      .insert([{
        user_id: app.citizen_id,
        title: 'Document Issued',
        message: 'Your ' + docName + ' has been issued. View it in Documents.',
        type: 'document',
        app_source: 'documents',
        redirect_url: 'documents'
      }]);

    if (notifError) console.error('Notification error:', notifError);

    showToast('Document created and citizen notified', 'success');
  } catch (err) {
    console.error('Error creating document:', err);
    showToast('Error creating document', 'error');
  }
}

function viewApplicationDetails(appId) {
  openReviewModal(appId, 'view');
  document.getElementById('reviewModalTitle').textContent = 'Application Details';
  var actions = document.querySelector('#reviewModal .modal-actions');
  if (actions) actions.innerHTML = '<button class="btn btn-outline w-full" onclick="closeReviewModal()">Close</button>';
}

async function loadDocuments() {
  var container = document.getElementById('govtDocList');
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading documents...</p></div>';

  try {
    var { data: documents, error } = await window.ViksitOS.supabase
      .from('documents')
      .select('*, citizen:profiles!documents_citizen_id_fkey(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    renderGovtDocuments(container, documents || []);
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Error Loading Documents</h3><p>' + err.message + '</p></div>';
  }
}

function renderGovtDocuments(container, documents) {
  var searchInput = document.getElementById('govtDocSearch');

  function filterAndRender() {
    var query = searchInput.value.toLowerCase();
    var filtered = documents;
    if (query) filtered = filtered.filter(function(d) {
      return (d.document_name && d.document_name.toLowerCase().includes(query)) ||
             (d.document_type && d.document_type.toLowerCase().includes(query)) ||
             (d.citizen && d.citizen.full_name && d.citizen.full_name.toLowerCase().includes(query)) ||
             (d.document_number && d.document_number.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-file-shield"></i><h3>No Documents Found</h3><p>Try adjusting your search</p></div>';
      return;
    }

    var html = '';
    filtered.forEach(function(doc) {
      var statusClass = 'badge-' + doc.status;
      var docIcon = getDocumentIcon(doc.document_type);

      html += '<div class="govt-doc-card">';
      html += '<div class="govt-doc-header">';
      html += '<div class="govt-doc-icon"><i class="fa-solid ' + docIcon + '"></i></div>';
      html += '<div class="govt-doc-info"><h4>' + doc.document_name + '</h4>';
      html += '<p>' + (doc.citizen ? doc.citizen.full_name : 'Unknown') + ' - ' + (doc.citizen ? doc.citizen.email : '') + '</p></div>';
      html += '<span class="badge ' + statusClass + '" style="margin-left:auto;">' + doc.status + '</span></div>';
      html += '<div class="govt-doc-meta">';
      html += '<span><i class="fa-solid fa-hashtag"></i> ' + (doc.document_number || 'N/A') + '</span>';
      html += '<span><i class="fa-regular fa-calendar"></i> Issued: ' + formatDate(doc.issued_date) + '</span>';
      if (doc.valid_until) html += '<span><i class="fa-solid fa-clock"></i> Valid until: ' + formatDate(doc.valid_until) + '</span>';
      html += '</div><div class="govt-doc-actions">';
      html += '<button class="btn btn-sm btn-outline" onclick="openEditDocModal(\'' + doc.id + '\')"><i class="fa-solid fa-pen"></i> Edit</button>';
      html += '<button class="btn btn-sm btn-outline" onclick="viewDocument(\'' + doc.id + '\')"><i class="fa-solid fa-eye"></i> View</button></div></div>';
    });
    container.innerHTML = html;
  }

  searchInput.addEventListener('input', filterAndRender);
  filterAndRender();
}

async function openEditDocModal(docId) {
  var modal = document.getElementById('editDocModal');
  var content = document.getElementById('editDocModalContent');

  try {
    var { data: doc, error } = await window.ViksitOS.supabase
      .from('documents')
      .select('*, citizen:profiles!documents_citizen_id_fkey(full_name, email)')
      .eq('id', docId)
      .single();

    if (error) throw error;

    var innerHtml = '<div class="application-details"><h4>Document Details</h4>';
    innerHtml += '<div class="detail-row"><span class="label">Document</span><span class="value">' + doc.document_name + '</span></div>';
    innerHtml += '<div class="detail-row"><span class="label">Owner</span><span class="value">' + (doc.citizen ? doc.citizen.full_name : '') + '</span></div>';
    innerHtml += '<div class="detail-row"><span class="label">Number</span><span class="value">' + (doc.document_number || 'N/A') + '</span></div>';
    innerHtml += '<div class="detail-row"><span class="label">Status</span><span class="value"><span class="badge badge-' + doc.status + '">' + doc.status + '</span></span></div></div>';

    innerHtml += '<div class="form-group"><label class="form-label">Update Status</label>';
    innerHtml += '<select class="form-select" id="docStatus">';
    innerHtml += '<option value="active"' + (doc.status === 'active' ? ' selected' : '') + '>Active</option>';
    innerHtml += '<option value="expired"' + (doc.status === 'expired' ? ' selected' : '') + '>Expired</option>';
    innerHtml += '<option value="revoked"' + (doc.status === 'revoked' ? ' selected' : '') + '>Revoked</option></select></div>';

    innerHtml += '<div class="form-group"><label class="form-label">Valid Until (optional)</label>';
    innerHtml += '<input type="date" class="form-input" id="docValidUntil" value="' + (doc.valid_until || '') + '"></div>';

    innerHtml += '<div class="form-group"><label class="form-label">Reason for Change <span style="color:var(--error)">*</span></label>';
    innerHtml += '<textarea class="form-textarea" id="docChangeReason" placeholder="Provide a reason for this change..." required></textarea></div>';

    innerHtml += '<div class="modal-actions">';
    innerHtml += '<button class="btn btn-outline" onclick="closeEditDocModal()">Cancel</button>';
    innerHtml += '<button class="btn btn-navy" onclick="submitDocEdit(\'' + docId + '\', \'' + doc.citizen_id + '\', \'' + doc.document_name + '\')">';
    innerHtml += '<i class="fa-solid fa-save"></i> Save Changes</button></div>';

    content.innerHTML = innerHtml;
    modal.classList.add('active');
  } catch (err) {
    showToast('Error loading document: ' + err.message, 'error');
  }
}

function closeEditDocModal() {
  document.getElementById('editDocModal').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('editDocModalClose').addEventListener('click', closeEditDocModal);
  document.getElementById('editDocModal').addEventListener('click', function(e) {
    if (e.target === document.getElementById('editDocModal')) closeEditDocModal();
  });
});

async function submitDocEdit(docId, citizenId, docName) {
  var status = document.getElementById('docStatus').value;
  var validUntil = document.getElementById('docValidUntil').value || null;
  var reason = document.getElementById('docChangeReason').value;

  if (!reason) {
    showToast('Please provide a reason for the change', 'error');
    return;
  }

  try {
    await window.ViksitOS.supabase
      .from('documents')
      .update({ status: status, valid_until: validUntil, updated_at: new Date().toISOString() })
      .eq('id', docId);

    await window.ViksitOS.supabase
      .from('notifications')
      .insert([{
        user_id: citizenId,
        title: 'Document Updated',
        message: 'Your ' + docName + ' has been updated. Reason: ' + reason,
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

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  var date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getDocumentIcon(type) {
  var icons = {
    'birth_certificate': 'fa-baby', 'death_certificate': 'fa-cross',
    'marriage_certificate': 'fa-rings-wedding', 'residence_certificate': 'fa-house-chimney',
    'income_certificate': 'fa-indian-rupee-sign', 'caste_certificate': 'fa-id-card',
    'domicile_certificate': 'fa-map-location-dot', 'survival_certificate': 'fa-heart-pulse',
    'aadhar': 'fa-fingerprint', 'pan': 'fa-id-badge', 'voter_id': 'fa-check-to-slot',
    'passport': 'fa-passport', 'driving_license': 'fa-car', 'ration_card': 'fa-credit-card'
  };
  return icons[type] || 'fa-file';
}

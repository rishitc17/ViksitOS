// Citizen Apply Services Module

function initApplyServices(container) {
  renderServiceList(container);
}

function renderServiceList(container) {
  var html = '';
  html += '<div class="search-container">';
  html += '<i class="fa-solid fa-magnifying-glass"></i>';
  html += '<input type="text" class="search-input" id="serviceSearch" placeholder="Search services...">';
  html += '</div>';
  html += '<div class="service-categories" id="serviceCategories">';

  for (var key in SERVICE_TYPES) {
    var category = SERVICE_TYPES[key];
    html += '<div class="service-category" data-category="' + key + '">';
    html += '<h3><i class="fa-solid ' + category.icon + '"></i> ' + category.label + '</h3>';
    html += '<div class="service-list">';

    for (var i = 0; i < category.services.length; i++) {
      var service = category.services[i];
      html += '<div class="service-item" data-service="' + service.id + '" data-name="' + service.name.toLowerCase() + '">';
      html += '<i class="fa-solid ' + service.icon + '"></i>';
      html += '<span>' + service.name + '</span>';
      html += '</div>';
    }

    html += '</div></div>';
  }

  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.service-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var serviceId = item.dataset.service;
      openServiceForm(container, serviceId);
    });
  });

  var searchInput = container.querySelector('#serviceSearch');
  searchInput.addEventListener('input', function(e) {
    var query = e.target.value.toLowerCase();
    container.querySelectorAll('.service-item').forEach(function(item) {
      var name = item.dataset.name;
      item.classList.toggle('hidden', !name.includes(query));
    });

    container.querySelectorAll('.service-category').forEach(function(cat) {
      var visibleItems = cat.querySelectorAll('.service-item:not(.hidden)');
      cat.style.display = visibleItems.length > 0 ? 'block' : 'none';
    });
  });
}

function openServiceForm(container, serviceId) {
  var service = findService(serviceId);
  if (!service) return;

  var fields = SERVICE_FORMS[serviceId] || [];

  var html = '';
  html += '<div class="service-form-container">';
  html += '<button class="btn btn-outline btn-sm mb-3" id="backToServices">';
  html += '<i class="fa-solid fa-arrow-left"></i> Back to Services';
  html += '</button>';
  html += '<div class="service-form-header">';
  html += '<i class="fa-solid ' + service.icon + '"></i>';
  html += '<div><h2>' + service.name + '</h2>';
  html += '<p class="text-muted">Fill in the required information</p></div>';
  html += '</div>';
  html += '<form id="serviceForm">';

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    html += '<div class="form-group">';
    html += '<label class="form-label">' + field.label + (field.required ? ' <span style="color:var(--error)">*</span>' : '') + '</label>';

    if (field.type === 'select') {
      html += '<select class="form-select" name="' + field.name + '" ' + (field.required ? 'required' : '') + '>';
      html += '<option value="">Select ' + field.label + '</option>';
      for (var j = 0; j < field.options.length; j++) {
        html += '<option value="' + field.options[j] + '">' + field.options[j] + '</option>';
      }
      html += '</select>';
    } else if (field.type === 'textarea') {
      html += '<textarea class="form-textarea" name="' + field.name + '" placeholder="' + (field.placeholder || '') + '" ' + (field.required ? 'required' : '') + '></textarea>';
    } else {
      html += '<input type="' + field.type + '" class="form-input" name="' + field.name + '" placeholder="' + (field.placeholder || '') + '" ' + (field.required ? 'required' : '') + (field.default ? ' value="' + field.default + '"' : '') + '>';
    }

    html += '</div>';
  }

  html += '<div class="form-actions">';
  html += '<button type="button" class="btn btn-outline" id="cancelForm">Cancel</button>';
  html += '<button type="submit" class="btn btn-primary">';
  html += '<i class="fa-solid fa-paper-plane"></i> Submit Application';
  html += '</button>';
  html += '</div>';
  html += '</form></div>';

  container.innerHTML = html;

  container.querySelector('#backToServices').addEventListener('click', function() {
    renderServiceList(container);
  });

  container.querySelector('#cancelForm').addEventListener('click', function() {
    renderServiceList(container);
  });

  container.querySelector('#serviceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    await submitApplication(serviceId, service.name);
  });
}

function findService(serviceId) {
  for (var key in SERVICE_TYPES) {
    var category = SERVICE_TYPES[key];
    for (var i = 0; i < category.services.length; i++) {
      if (category.services[i].id === serviceId) return category.services[i];
    }
  }
  return null;
}

async function submitApplication(serviceId, serviceName) {
  var form = document.getElementById('serviceForm');
  var formData = new FormData(form);
  var data = {};
  formData.forEach(function(value, key) { data[key] = value; });

  var submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;"></div> Submitting...';

  try {
    var { error } = await window.ViksitOS.supabase
      .from('applications')
      .insert([{
        citizen_id: userProfile.id,
        service_type: serviceId,
        service_name: serviceName,
        status: 'pending',
        form_data: data
      }]);

    if (error) throw error;

    await window.ViksitOS.supabase
      .from('notifications')
      .insert([{
        user_id: userProfile.id,
        title: 'Application Submitted',
        message: 'Your ' + serviceName + ' application has been submitted successfully.',
        type: 'application',
        app_source: 'apply',
        redirect_url: 'applications'
      }]);

    showToast('Application submitted successfully!', 'success');
    await loadNotifications();

    var container = document.getElementById('appViewContent');
    renderServiceList(container);

  } catch (err) {
    showToast('Failed to submit application: ' + err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Application';
  }
}

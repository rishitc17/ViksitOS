// Citizen Apply Services Module
const supabase = window.ViksitOS ? window.ViksitOS.supabase : null;

function initApplyServices(container) {
  renderServiceList(container);
}

function renderServiceList(container) {
  let html = `
    <div class="search-container">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input type="text" class="search-input" id="serviceSearch" placeholder="Search services...">
    </div>
    <div class="service-categories" id="serviceCategories">
  `;

  for (const [key, category] of Object.entries(SERVICE_TYPES)) {
    html += `
      <div class="service-category" data-category="${key}">
        <h3><i class="fa-solid ${category.icon}"></i> ${category.label}</h3>
        <div class="service-list">
    `;

    for (const service of category.services) {
      html += `
        <div class="service-item" data-service="${service.id}" data-name="${service.name.toLowerCase()}">
          <i class="fa-solid ${service.icon}"></i>
          <span>${service.name}</span>
        </div>
      `;
    }

    html += `</div></div>`;
  }

  html += `</div>`;
  container.innerHTML = html;

  // Attach event listeners
  container.querySelectorAll('.service-item').forEach(item => {
    item.addEventListener('click', () => {
      const serviceId = item.dataset.service;
      openServiceForm(container, serviceId);
    });
  });

  // Search functionality
  const searchInput = container.querySelector('#serviceSearch');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    container.querySelectorAll('.service-item').forEach(item => {
      const name = item.dataset.name;
      item.classList.toggle('hidden', !name.includes(query));
    });

    // Hide empty categories
    container.querySelectorAll('.service-category').forEach(cat => {
      const visibleItems = cat.querySelectorAll('.service-item:not(.hidden)');
      cat.style.display = visibleItems.length > 0 ? 'block' : 'none';
    });
  });
}

function openServiceForm(container, serviceId) {
  const service = findService(serviceId);
  if (!service) return;

  const fields = SERVICE_FORMS[serviceId] || [];

  let html = `
    <div class="service-form-container">
      <button class="btn btn-outline btn-sm mb-3" id="backToServices">
        <i class="fa-solid fa-arrow-left"></i> Back to Services
      </button>
      <div class="service-form-header">
        <i class="fa-solid ${service.icon}"></i>
        <div>
          <h2>${service.name}</h2>
          <p class="text-muted">Fill in the required information</p>
        </div>
      </div>
      <form id="serviceForm">
  `;

  for (const field of fields) {
    html += `<div class="form-group">`;
    html += `<label class="form-label">${field.label} ${field.required ? '<span style="color:var(--error)">*</span>' : ''}</label>`;

    if (field.type === 'select') {
      html += `<select class="form-select" name="${field.name}" ${field.required ? 'required' : ''}>`;
      html += `<option value="">Select ${field.label}</option>`;
      for (const opt of field.options) {
        html += `<option value="${opt}">${opt}</option>`;
      }
      html += `</select>`;
    } else if (field.type === 'textarea') {
      html += `<textarea class="form-textarea" name="${field.name}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>`;
    } else {
      html += `<input type="${field.type}" class="form-input" name="${field.name}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} ${field.default ? `value="${field.default}"` : ''}>`;
    }

    html += `</div>`;
  }

  html += `
        <div class="form-actions">
          <button type="button" class="btn btn-outline" id="cancelForm">Cancel</button>
          <button type="submit" class="btn btn-primary">
            <i class="fa-solid fa-paper-plane"></i> Submit Application
          </button>
        </div>
      </form>
    </div>
  `;

  container.innerHTML = html;

  // Back button
  container.querySelector('#backToServices').addEventListener('click', () => {
    renderServiceList(container);
  });

  container.querySelector('#cancelForm').addEventListener('click', () => {
    renderServiceList(container);
  });

  // Form submission
  container.querySelector('#serviceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitApplication(serviceId, service.name);
  });
}

function findService(serviceId) {
  for (const category of Object.values(SERVICE_TYPES)) {
    const service = category.services.find(s => s.id === serviceId);
    if (service) return service;
  }
  return null;
}

async function submitApplication(serviceId, serviceName) {
  const form = document.getElementById('serviceForm');
  const formData = new FormData(form);
  const data = {};
  
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;"></div> Submitting...';

  try {
    const { error } = await supabase
      .from('applications')
      .insert([{
        citizen_id: userProfile.id,
        service_type: serviceId,
        service_name: serviceName,
        status: 'pending',
        form_data: data
      }]);

    if (error) throw error;

    // Create notification for citizen
    await supabase
      .from('notifications')
      .insert([{
        user_id: userProfile.id,
        title: 'Application Submitted',
        message: `Your ${serviceName} application has been submitted successfully.`,
        type: 'application',
        app_source: 'apply',
        redirect_url: 'applications'
      }]);

    showToast('Application submitted successfully!', 'success');
    
    // Reload notifications
    await loadNotifications();

    // Go back to services list
    const container = document.getElementById('appViewContent');
    renderServiceList(container);

  } catch (err) {
    showToast('Failed to submit application: ' + err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Application';
  }
}

// Notifications Module

async function loadNotifications() {
  if (!userProfile || !window.ViksitOS.supabase) return;

  try {
    const { data: notifications, error } = await window.ViksitOS.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    renderNotifications(notifications || []);
    updateNotifBadge(notifications || []);
  } catch (err) {
    console.error('Error loading notifications:', err);
  }
}

function renderNotifications(notifications) {
  const list = document.getElementById('notifList');
  if (!list) return;

  if (notifications.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding:40px 20px;">
        <i class="fa-regular fa-bell"></i>
        <h3>No Notifications</h3>
        <p>You're all caught up!</p>
      </div>
    `;
    return;
  }

  let html = '';
  for (const notif of notifications) {
    const icon = notif.type === 'application' ? 'fa-file-lines' : 
                 notif.type === 'document' ? 'fa-file-shield' : 'fa-bell';
    
    html += `
      <div class="notif-item ${notif.read ? '' : 'unread'}" data-id="${notif.id}" data-redirect="${notif.redirect_url || ''}">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i class="fa-solid ${icon}" style="color:var(--saffron);"></i>
          </div>
          <div style="flex:1;">
            <div class="notif-title">${notif.title}</div>
            <div class="notif-message">${notif.message}</div>
            <div class="notif-time">${formatRelativeTime(notif.created_at)}</div>
          </div>
        </div>
      </div>
    `;
  }

  list.innerHTML = html;

  list.querySelectorAll('.notif-item').forEach(item => {
    item.addEventListener('click', async () => {
      const id = item.dataset.id;
      const redirect = item.dataset.redirect;

      await window.ViksitOS.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      item.classList.remove('unread');
      updateNotifBadge();

      document.getElementById('notifPanel').classList.remove('active');
      document.getElementById('notifOverlay').classList.remove('active');

      if (redirect) {
        openApp(redirect);
      }
    });
  });
}

function updateNotifBadge(notifications) {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;

  if (!notifications) {
    const unread = document.querySelectorAll('.notif-item.unread').length;
    if (unread > 0) {
      badge.textContent = unread > 9 ? '9+' : unread;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
    return;
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

async function markAllNotificationsRead() {
  if (!userProfile || !window.ViksitOS.supabase) return;

  await window.ViksitOS.supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userProfile.id)
    .eq('read', false);

  await loadNotifications();
  showToast('All notifications marked as read', 'success');
}

async function createNotification(userId, title, message, type, appSource, redirectUrl) {
  type = type || 'system';
  if (!window.ViksitOS.supabase) return;

  try {
    await window.ViksitOS.supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        type,
        app_source: appSource,
        redirect_url: redirectUrl
      }]);
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

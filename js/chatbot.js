// Chatbot Module

let chatbotOpen = false;

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('chatbotToggle');
  const close = document.getElementById('chatbotClose');
  const window = document.getElementById('chatbotWindow');

  if (!toggle) return;

  toggle.addEventListener('click', () => {
    chatbotOpen = !chatbotOpen;
    window.classList.toggle('active', chatbotOpen);
    
    if (chatbotOpen && document.getElementById('chatbotMessages').children.length === 0) {
      initChatbot();
    }
  });

  if (close) {
    close.addEventListener('click', () => {
      chatbotOpen = false;
      window.classList.remove('active');
    });
  }
});

function initChatbot() {
  showChatbotResponse('greeting');
}

function showChatbotResponse(actionKey) {
  const response = CHATBOT_RESPONSES[actionKey];
  if (!response) return;

  const messages = document.getElementById('chatbotMessages');
  const options = document.getElementById('chatbotOptions');

  // Add bot message
  const msgDiv = document.createElement('div');
  msgDiv.className = 'chat-message bot';
  msgDiv.textContent = response.message;
  messages.appendChild(msgDiv);
  messages.scrollTop = messages.scrollHeight;

  // Add options
  options.innerHTML = '';
  for (const opt of response.options) {
    const btn = document.createElement('button');
    btn.className = 'chat-option';
    btn.textContent = opt.label;
    btn.addEventListener('click', () => handleChatOption(opt, response.message));
    options.appendChild(btn);
  }
}

function handleChatOption(option, botMessage) {
  const messages = document.getElementById('chatbotMessages');
  const options = document.getElementById('chatbotOptions');

  // Add user message
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-message user';
  userMsg.textContent = option.label;
  messages.appendChild(userMsg);

  // Clear options
  options.innerHTML = '';

  // Check for redirect
  if (option.redirect) {
    const redirectMsg = document.createElement('div');
    redirectMsg.className = 'chat-message bot';
    redirectMsg.innerHTML = `Opening <strong>${option.label}</strong> for you...`;
    messages.appendChild(redirectMsg);
    messages.scrollTop = messages.scrollHeight;

    // Close chatbot and open app
    setTimeout(() => {
      chatbotOpen = false;
      document.getElementById('chatbotWindow').classList.remove('active');
      openApp(option.redirect);
    }, 1000);
    return;
  }

  // Show next response
  setTimeout(() => {
    showChatbotResponse(option.action);
    messages.scrollTop = messages.scrollHeight;
  }, 300);
}

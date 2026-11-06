// Auto-resize input box like Gemini
const textarea = document.getElementById('userInput');
textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
});

// Plus Icon Dropdown Toggle
const plusBtn = document.getElementById('plusBtn');
const plusDropdown = document.getElementById('plusDropdown');

plusBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  plusDropdown.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', () => {
  plusDropdown.classList.remove('active');
});

// Voice-to-Text (Speech Recognition)
const micBtn = document.getElementById('micBtn');

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  micBtn.addEventListener('click', () => {
    micBtn.style.color = '#ef4444'; // Red color while recording
    recognition.start();
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    textarea.value += transcript;
    micBtn.style.color = '#c4c7c5';
  };

  recognition.onerror = () => {
    micBtn.style.color = '#c4c7c5';
  };

  recognition.onend = () => {
    micBtn.style.color = '#c4c7c5';
  };
} else {
  micBtn.style.display = 'none'; // Hide if browser doesn't support mic
}

// Camera Action Example
document.getElementById('cameraBtn').addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    alert("Camera access granted!");
    // Stream ko handle kar sakte hain
  } catch (err) {
    alert("Camera access denied or not supported.");
  }
});

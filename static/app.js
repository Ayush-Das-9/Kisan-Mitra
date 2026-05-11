/**
 * Kisan Mitra — Numpad Interaction Controller
 * Handles numpad input, display updates, and Gemini API calls.
 */

(function () {
    'use strict';

    // ===== DOM REFERENCES =====
    const displayValue = document.getElementById('display-value');
    const displayStatus = document.getElementById('display-status');
    const responseArea = document.getElementById('response-area');
    const responseIcon = document.getElementById('response-icon');
    const responseText = document.getElementById('response-text');
    const numpadGrid = document.getElementById('numpad-grid');
    const tickerElement = document.getElementById('ticker-text');

    // ===== STATE =====
    let currentInput = '';
    let isLoading = false;
    const MAX_DIGITS = 4;

    const menuMeta = {
        '1': { label: 'गेंहू के फसल की जानकारी', icon: '🌾' },
        '2': { label: 'किसान समाचार', icon: '📰' },
        '3': { label: 'कपास की खेती में उपयोग होने वाले उर्वरक', icon: '🧪' },
        '4': { label: 'आज का मंडी भाव', icon: '💰' },
        '5': { label: 'मौसम की जानकारी', icon: '🌤️' },
        '6': { label: 'फसल रोग पहचान', icon: '🔬' },
        '7': { label: 'सिंचाई के सुझाव', icon: '💧' },
        '8': { label: 'मिट्टी की जांच', icon: '🪨' },
    };

    // ===== TICKER =====
    const tickerItems = [
        '1. गेंहू के फसल की जानकारी',
        '2. किसान समाचार',
        '3. कपास की खेती में उपयोग होने वाले उर्वरक',
        '4. आज का मंडी भाव',
        '5. मौसम की जानकारी',
        '6. फसल रोग पहचान',
        '7. सिंचाई के सुझाव',
        '8. मिट्टी की जांच',
    ];
    let tickerIndex = 0;

    setInterval(() => {
        tickerIndex++;
        if (tickerIndex >= tickerItems.length) {
            tickerIndex = 0;
        }
        // Fade out, swap text, fade in
        tickerElement.classList.add('ticker-fade-out');
        setTimeout(() => {
            tickerElement.innerText = tickerItems[tickerIndex];
            tickerElement.classList.remove('ticker-fade-out');
            tickerElement.classList.add('ticker-fade-in');
            setTimeout(() => tickerElement.classList.remove('ticker-fade-in'), 400);
        }, 300);
    }, 3000);

    // ===== DISPLAY FUNCTIONS =====
    function updateDisplay() {
        displayValue.textContent = currentInput || '_';
        displayValue.classList.remove('pop');
        void displayValue.offsetWidth;
        displayValue.classList.add('pop');

        if (currentInput) {
            displayStatus.textContent = '✓ दबाएं पुष्टि के लिए या C दबाएं मिटाने के लिए';
            displayStatus.classList.add('active');
        } else {
            displayStatus.textContent = 'शुरू करने के लिए नंबर दबाएं';
            displayStatus.classList.remove('active');
        }

    }

    function showLoading(option) {
        const meta = menuMeta[option] || { icon: '⏳', label: 'लोड हो रहा है' };
        responseIcon.textContent = '⏳';
        responseText.innerHTML = `<span class="loading-dots"><strong>${meta.label}</strong> के बारे में पूछ रहे हैं...</span>`;
        responseArea.classList.remove('hidden');
        responseArea.style.animation = 'none';
        void responseArea.offsetWidth;
        responseArea.style.animation = '';
    }

    function showResponse(option, text) {
        const meta = menuMeta[option] || { icon: '💬' };
        responseIcon.textContent = meta.icon;
        responseText.textContent = text;
        responseArea.classList.remove('hidden');
        responseArea.style.animation = 'none';
        void responseArea.offsetWidth;
        responseArea.style.animation = '';
    }

    function showError(message) {
        responseIcon.textContent = '⚠️';
        responseText.textContent = message;
        responseArea.classList.remove('hidden');
    }

    function hideResponse() {
        responseArea.classList.add('hidden');
    }

    // ===== INPUT HANDLERS =====
    function handleNumberInput(num) {
        if (isLoading || currentInput.length >= MAX_DIGITS) return;
        currentInput += num;
        updateDisplay();
    }

    function handleClear() {
        // Stop any ongoing speech when C is pressed
        stopSpeaking();
        if (isLoading) return;
        currentInput = '';
        updateDisplay();
        hideResponse();
    }

    async function handleSubmit() {
        if (isLoading) return;
        if (!currentInput) {
            displayValue.parentElement.classList.add('shake');
            setTimeout(() => displayValue.parentElement.classList.remove('shake'), 400);
            return;
        }

        const option = currentInput;

        // Only valid options 1–8 call Groq (9 does nothing)
        if (!menuMeta[option]) {
            showError(`विकल्प "${option}" उपलब्ध नहीं है। कृपया 1 से 8 के बीच नंबर दर्ज करें।`);
            currentInput = '';
            updateDisplay();
            return;
        }

        isLoading = true;
        setNumpadDisabled(true);
        showLoading(option);
        currentInput = '';
        updateDisplay();

        try {
            const res = await fetch(`/api/menu/${option}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Server error');
            }
            const data = await res.json();
            showResponse(option, data.result);
            // Read the Hindi response aloud
            speakHindi(data.result);
        } catch (err) {
            showError(`त्रुटि: ${err.message}। कृपया पुनः प्रयास करें।`);
        } finally {
            isLoading = false;
            setNumpadDisabled(false);
        }
    }

    function setNumpadDisabled(disabled) {
        numpadGrid.querySelectorAll('.numpad-btn').forEach(btn => {
            btn.disabled = disabled;
            btn.style.opacity = disabled ? '0.5' : '1';
        });
    }

    // ===== EVENT LISTENERS =====

    // Numpad click (event delegation)
    numpadGrid.addEventListener('click', function (e) {
        const btn = e.target.closest('.numpad-btn');
        if (!btn || btn.disabled) return;

        const value = btn.getAttribute('data-value');
        if (value === 'C') {
            handleClear();
        } else if (value === 'OK') {
            handleSubmit();
        } else {
            handleNumberInput(value);
        }
    });

    // Ripple effect
    numpadGrid.addEventListener('pointerdown', function (e) {
        const btn = e.target.closest('.numpad-btn');
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        btn.style.setProperty('--ripple-x', ((e.clientX - rect.left) / rect.width * 100) + '%');
        btn.style.setProperty('--ripple-y', ((e.clientY - rect.top) / rect.height * 100) + '%');
    });

    // Keyboard support
    document.addEventListener('keydown', function (e) {
        if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            handleNumberInput(e.key);
            const btn = document.getElementById('btn-' + e.key);
            if (btn) {
                btn.classList.add('num-btn-pressed');
                setTimeout(() => btn.classList.remove('num-btn-pressed'), 150);
            }
        }
        if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
        if (e.key === 'Escape' || e.key === 'Backspace' || e.key.toLowerCase() === 'c') {
            e.preventDefault(); handleClear();
        }
    });

    // Prevent double-tap zoom on mobile
    let lastTap = 0;
    numpadGrid.addEventListener('touchend', function (e) {
        const now = Date.now();
        if (now - lastTap < 300) e.preventDefault();
        lastTap = now;
    }, { passive: false });

    // ===== VOICE / TTS (Web Speech API — Hindi) =====
    const voiceBtn = document.getElementById('voice-greeting-btn');
    const voiceBtnIcon = document.getElementById('voice-btn-icon');
    const voiceBtnLabel = document.getElementById('voice-btn-label');
    let isSpeaking = false;

    // Pick the best Hindi voice available
    function getHindiVoice() {
        const voices = window.speechSynthesis.getVoices();
        return voices.find(v => v.lang === 'hi-IN' && v.name.includes('Google'))
            || voices.find(v => v.lang === 'hi-IN')
            || voices.find(v => v.lang.startsWith('hi'))
            || null;
    }

    // General-purpose Hindi TTS helper
    function speakHindi(text, onEnd) {
        if (!('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN';
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1;
        const hindiVoice = getHindiVoice();
        if (hindiVoice) utterance.voice = hindiVoice;
        if (onEnd) utterance.onend = onEnd;
        window.speechSynthesis.speak(utterance);
    }

    // Stop any ongoing speech
    function stopSpeaking() {
        window.speechSynthesis.cancel();
        setSpeakingState(false);
    }

    function speakGreeting() {
        if (!('speechSynthesis' in window)) {
            console.warn('SpeechSynthesis API not supported in this browser.');
            return;
        }

        // Toggle off if already speaking
        if (isSpeaking) {
            stopSpeaking();
            return;
        }

        window.speechSynthesis.cancel();
        setSpeakingState(true);

        const greetingText = 'किसान मित्र में आपका स्वागत है, आपका किसान सहायक।';
        const menuText = 'विकल्प 1: गेंहू के फसल की जानकारी। विकल्प 2: किसान समाचार। विकल्प 3: कपास उर्वरक। विकल्प 4: मंडी भाव। विकल्प 5: मौसम जानकारी। विकल्प 6: फसल रोग। विकल्प 7: सिंचाई सुझाव। विकल्प 8: मिट्टी जांच।';

        function doSpeak() {
            speakHindi(greetingText);
            speakHindi(menuText, () => setSpeakingState(false));
        }

        // Voices may load async
        if (window.speechSynthesis.getVoices().length > 0) {
            doSpeak();
        } else {
            window.speechSynthesis.addEventListener('voiceschanged', function handler() {
                window.speechSynthesis.removeEventListener('voiceschanged', handler);
                doSpeak();
            });
        }
    }

    function setSpeakingState(speaking) {
        isSpeaking = speaking;
        if (speaking) {
            voiceBtn.classList.add('speaking');
            voiceBtnIcon.textContent = '⏹️';
            voiceBtnLabel.textContent = 'रुकें';
        } else {
            voiceBtn.classList.remove('speaking');
            voiceBtnIcon.textContent = '🔊';
            voiceBtnLabel.textContent = 'मेनू सुनें';
        }
    }

    voiceBtn.addEventListener('click', speakGreeting);

    // ===== INIT =====
    updateDisplay();

})();

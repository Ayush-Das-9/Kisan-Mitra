/**
 * Kisan Mitra — Numpad Interaction Controller
 * Handles numpad input, display updates, and Gemini API calls.
 */

(function () {
    'use strict';

    // ===== TRANSLATIONS =====
    const translations = {
        hi: {
            tagline: 'आपका डिजिटल कृषि सहायक',
            voiceBtnLabel: 'मेनू सुनें',
            voiceBtnStop: 'रुकें',
            displayLabel: 'नंबर दर्ज करें',
            displayIdle: 'शुरू करने के लिए नंबर दबाएं',
            displayReady: '✓ दबाएं पुष्टि के लिए या C दबाएं मिटाने के लिए',
            loading: (label) => `<span class="loading-dots"><strong>${label}</strong> के बारे में पूछ रहे हैं...</span>`,
            voiceListening: '<span class="loading-dots"><strong>बोलिए...</strong> रुकने के लिए ✓ दबाएं</span>',
            voiceProcessing: '<span class="loading-dots">आपकी आवाज़ समझ रहे हैं...</span>',
            voiceYouSaid: 'आपने कहा: ',
            errorInvalid: (opt) => `विकल्प "${opt}" उपलब्ध नहीं है। कृपया 1 से 9 के बीच नंबर दर्ज करें।`,
            errorMic: 'माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया अनुमति दें।',
            errorGeneric: (msg) => `त्रुटि: ${msg}। कृपया पुनः प्रयास करें।`,
            footer: 'किसान मित्र © 2026 — किसानों को सशक्त बनाना',
            greetingText: 'किसान मित्र में आपका स्वागत है, आपका किसान सहायक।',
            greetingMenu: 'विकल्प 1: गेंहू के फसल की जानकारी। विकल्प 2: किसान समाचार। विकल्प 3: कपास उर्वरक। विकल्प 4: मंडी भाव। विकल्प 5: मौसम जानकारी। विकल्प 6: फसल रोग। विकल्प 7: सिंचाई सुझाव। विकल्प 8: फोटो से रोग पहचान। विकल्प 9: AI से बात करें।',
            menu: {
                '1': { label: 'गेंहू के फसल की जानकारी', icon: '🌾' },
                '2': { label: 'किसान समाचार', icon: '📰' },
                '3': { label: 'कपास की खेती में उपयोग होने वाले उर्वरक', icon: '🧪' },
                '4': { label: 'आज का मंडी भाव', icon: '💰' },
                '5': { label: 'मौसम की जानकारी', icon: '🌤️' },
                '6': { label: 'फसल रोग पहचान', icon: '🔬' },
                '7': { label: 'सिंचाई के सुझाव', icon: '💧' },
                '8': { label: 'फोटो से रोग पहचान', icon: '📷' },
                '9': { label: 'AI से बात करें', icon: '🎙️' },
            },
            ticker: [
                '1. गेंहू के फसल की जानकारी',
                '2. किसान समाचार',
                '3. कपास की खेती में उपयोग होने वाले उर्वरक',
                '4. आज का मंडी भाव',
                '5. मौसम की जानकारी',
                '6. फसल रोग पहचान',
                '7. सिंचाई के सुझाव',
                '8. फोटो से रोग पहचान',
                '9. AI से बात करें',
            ],
        },
        pa: {
            tagline: 'ਤੁਹਾਡਾ ਡਿਜੀਟਲ ਖੇਤੀਬਾੜੀ ਸਹਾਇਕ',
            voiceBtnLabel: 'ਮੀਨੂ ਸੁਣੋ',
            voiceBtnStop: 'ਰੁਕੋ',
            displayLabel: 'ਨੰਬਰ ਦਰਜ ਕਰੋ',
            displayIdle: 'ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਨੰਬਰ ਦਬਾਓ',
            displayReady: '✓ ਦਬਾਓ ਪੁਸ਼ਟੀ ਲਈ ਜਾਂ C ਦਬਾਓ ਮਿਟਾਉਣ ਲਈ',
            loading: (label) => `<span class="loading-dots"><strong>${label}</strong> ਬਾਰੇ ਪੁੱਛ ਰਹੇ ਹਾਂ...</span>`,
            voiceListening: '<span class="loading-dots"><strong>ਬੋਲੋ...</strong> ਰੁਕਣ ਲਈ ✓ ਦਬਾਓ</span>',
            voiceProcessing: '<span class="loading-dots">ਤੁਹਾਡੀ ਆਵਾਜ਼ ਸਮਝ ਰਹੇ ਹਾਂ...</span>',
            voiceYouSaid: 'ਤੁਸੀਂ ਕਿਹਾ: ',
            errorInvalid: (opt) => `ਵਿਕਲਪ "${opt}" ਉਪਲਬਧ ਨਹੀਂ। ਕਿਰਪਾ ਕਰਕੇ 1 ਤੋਂ 9 ਵਿੱਚੋਂ ਨੰਬਰ ਦਰਜ ਕਰੋ।`,
            errorMic: 'ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ। ਕਿਰਪਾ ਕਰਕੇ ਇਜਾਜ਼ਤ ਦਿਓ।',
            errorGeneric: (msg) => `ਗਲਤੀ: ${msg}। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।`,
            footer: 'ਕਿਸਾਨ ਮਿੱਤਰ © 2026 — ਕਿਸਾਨਾਂ ਨੂੰ ਸਸ਼ਕਤ ਬਣਾਉਣਾ',
            greetingText: 'ਕਿਸਾਨ ਮਿੱਤਰ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ, ਤੁਹਾਡਾ ਕਿਸਾਨ ਸਹਾਇਕ।',
            greetingMenu: 'ਵਿਕਲਪ 1: ਕਣਕ ਦੀ ਫ਼ਸਲ। ਵਿਕਲਪ 2: ਕਿਸਾਨ ਖ਼ਬਰਾਂ। ਵਿਕਲਪ 3: ਕਪਾਹ ਖਾਦ। ਵਿਕਲਪ 4: ਮੰਡੀ ਭਾਅ। ਵਿਕਲਪ 5: ਮੌਸਮ। ਵਿਕਲਪ 6: ਫ਼ਸਲ ਰੋਗ। ਵਿਕਲਪ 7: ਸਿੰਚਾਈ। ਵਿਕਲਪ 8: ਫ਼ੋਟੋ ਤੋਂ ਰੋਗ। ਵਿਕਲਪ 9: AI ਨਾਲ ਗੱਲ ਕਰੋ।',
            menu: {
                '1': { label: 'ਕਣਕ ਦੀ ਫ਼ਸਲ ਦੀ ਜਾਣਕਾਰੀ', icon: '🌾' },
                '2': { label: 'ਕਿਸਾਨ ਖ਼ਬਰਾਂ', icon: '📰' },
                '3': { label: 'ਕਪਾਹ ਦੀ ਖੇਤੀ ਲਈ ਖਾਦ', icon: '🧪' },
                '4': { label: 'ਅੱਜ ਦਾ ਮੰਡੀ ਭਾਅ', icon: '💰' },
                '5': { label: 'ਮੌਸਮ ਦੀ ਜਾਣਕਾਰੀ', icon: '🌤️' },
                '6': { label: 'ਫ਼ਸਲ ਰੋਗ ਪਛਾਣ', icon: '🔬' },
                '7': { label: 'ਸਿੰਚਾਈ ਦੇ ਸੁਝਾਅ', icon: '💧' },
                '8': { label: 'ਫ਼ੋਟੋ ਤੋਂ ਰੋਗ ਪਛਾਣ', icon: '📷' },
                '9': { label: 'AI ਨਾਲ ਗੱਲ ਕਰੋ', icon: '🎙️' },
            },
            ticker: [
                '1. ਕਣਕ ਦੀ ਫ਼ਸਲ ਦੀ ਜਾਣਕਾਰੀ',
                '2. ਕਿਸਾਨ ਖ਼ਬਰਾਂ',
                '3. ਕਪਾਹ ਦੀ ਖੇਤੀ ਲਈ ਖਾਦ',
                '4. ਅੱਜ ਦਾ ਮੰਡੀ ਭਾਅ',
                '5. ਮੌਸਮ ਦੀ ਜਾਣਕਾਰੀ',
                '6. ਫ਼ਸਲ ਰੋਗ ਪਛਾਣ',
                '7. ਸਿੰਚਾਈ ਦੇ ਸੁਝਾਅ',
                '8. ਫ਼ੋਟੋ ਤੋਂ ਰੋਗ ਪਛਾਣ',
                '9. AI ਨਾਲ ਗੱਲ ਕਰੋ',
            ],
        },
        en: {
            tagline: 'Your Digital Farming Assistant',
            voiceBtnLabel: 'Hear Menu',
            voiceBtnStop: 'Stop',
            displayLabel: 'Enter Number',
            displayIdle: 'Press a number to start',
            displayReady: 'Press ✓ to confirm or C to clear',
            loading: (label) => `<span class="loading-dots">Asking about <strong>${label}</strong>...</span>`,
            voiceListening: '<span class="loading-dots"><strong>Speak now...</strong> Press ✓ to stop</span>',
            voiceProcessing: '<span class="loading-dots">Understanding your voice...</span>',
            voiceYouSaid: 'You said: ',
            errorInvalid: (opt) => `Option "${opt}" is not available. Please enter a number between 1 and 9.`,
            errorMic: 'Microphone permission denied. Please allow access.',
            errorGeneric: (msg) => `Error: ${msg}. Please try again.`,
            footer: 'Kisan Mitra © 2026 — Empowering Farmers',
            greetingText: 'Welcome to Kisan Mitra, your farming assistant.',
            greetingMenu: 'Option 1: Wheat crop info. Option 2: Farmer news. Option 3: Cotton fertilizers. Option 4: Market prices. Option 5: Weather. Option 6: Crop disease. Option 7: Irrigation tips. Option 8: Photo disease detection. Option 9: Talk to AI.',
            menu: {
                '1': { label: 'Wheat Crop Information', icon: '🌾' },
                '2': { label: 'Farmer News', icon: '📰' },
                '3': { label: 'Cotton Farming Fertilizers', icon: '🧪' },
                '4': { label: "Today's Market Price", icon: '💰' },
                '5': { label: 'Weather Information', icon: '🌤️' },
                '6': { label: 'Crop Disease Detection', icon: '🔬' },
                '7': { label: 'Irrigation Tips', icon: '💧' },
                '8': { label: 'Photo Disease Detection', icon: '📷' },
                '9': { label: 'Talk to AI', icon: '🎙️' },
            },
            ticker: [
                '1. Wheat Crop Information',
                '2. Farmer News',
                '3. Cotton Farming Fertilizers',
                "4. Today's Market Price",
                '5. Weather Information',
                '6. Crop Disease Detection',
                '7. Irrigation Tips',
                '8. Photo Disease Detection',
                '9. Talk to AI',
            ],
        },
    };

    // ===== ACTIVE LANGUAGE =====
    let lang = 'hi';
    let t = translations[lang];

    // ===== LANGUAGE CHOOSER =====
    const langChooser = document.getElementById('lang-chooser');
    const appContainer = document.getElementById('app-container');

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            lang = this.dataset.lang;
            t = translations[lang];
            unlockAudio();
            document.getElementById('html-root').lang = lang;
            langChooser.style.display = 'none';
            appContainer.style.display = '';
            applyTranslations();
            tickerItems = t.ticker.slice();
            tickerIndex = 0;
            tickerElement.innerText = tickerItems[0];
            updateDisplay();
        });
    });

    function applyTranslations() {
        document.querySelector('.tagline').textContent = t.tagline;
        document.getElementById('voice-btn-label').textContent = t.voiceBtnLabel;
        document.querySelector('.display-label').textContent = t.displayLabel;
        document.querySelector('.app-footer p').textContent = t.footer;
    }

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

    // Voice chat state
    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];

    // menuMeta is derived from active translation
    function getMenuMeta() { return t.menu; }

    // ===== TICKER =====
    let tickerItems = t.ticker.slice();
    let tickerIndex = 0;

    setInterval(() => {
        tickerIndex++;
        if (tickerIndex >= tickerItems.length) {
            tickerIndex = 0;
        }
        tickerElement.classList.add('ticker-fade-out');
        setTimeout(() => {
            tickerElement.innerText = tickerItems[tickerIndex];
            tickerElement.classList.remove('ticker-fade-out');
            tickerElement.classList.add('ticker-fade-in');
            setTimeout(() => tickerElement.classList.remove('ticker-fade-in'), 400);
        }, 300);
    }, 3000);

    // DISPLAY FUNCTIONS 
    function updateDisplay() {
        displayValue.textContent = currentInput || '_';
        displayValue.classList.remove('pop');
        void displayValue.offsetWidth;
        displayValue.classList.add('pop');

        if (currentInput) {
            displayStatus.textContent = t.displayReady;
            displayStatus.classList.add('active');
        } else {
            displayStatus.textContent = t.displayIdle;
            displayStatus.classList.remove('active');
        }

    }

    function showLoading(option) {
        const meta = getMenuMeta()[option] || { icon: '⏳', label: t.displayIdle };
        responseIcon.textContent = '⏳';
        responseText.innerHTML = t.loading(meta.label);
        responseArea.classList.remove('hidden');
        responseArea.style.animation = 'none';
        void responseArea.offsetWidth;
        responseArea.style.animation = '';
    }

    function showResponse(option, text) {
        const meta = getMenuMeta()[option] || { icon: '💬' };
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

        // Only valid options 1–9 call Groq
        if (!getMenuMeta()[option]) {
            showError(t.errorInvalid(option));
            currentInput = '';
            updateDisplay();
            return;
        }

        // Option 8: Image upload for disease detection
        if (option === '8') {
            currentInput = '';
            updateDisplay();
            triggerImageUpload();
            return;
        }

        // Option 9: Voice chat — start recording
        if (option === '1' || option === '9') {
            currentInput = '';
            updateDisplay();
            startVoiceRecording();
            return;
        }

        isLoading = true;
        setNumpadDisabled(true);
        showLoading(option);
        currentInput = '';
        updateDisplay();

        try {
            const res = await fetch(`/api/menu/${option}?lang=${encodeURIComponent(lang)}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Server error');
            }
            const data = await res.json();
            showResponse(option, data.result);
            // Read the response aloud in the selected language
            speak(data.result);
        } catch (err) {
            showError(t.errorGeneric(err.message));
        } finally {
            isLoading = false;
            setNumpadDisabled(false);
        }
    }

    // ===== IMAGE UPLOAD FOR OPTION 8 =====
    function triggerImageUpload() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.capture = 'environment'; // prefer rear camera on mobile
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        fileInput.addEventListener('change', async function () {
            const file = fileInput.files[0];
            document.body.removeChild(fileInput);
            if (!file) return;

            isLoading = true;
            setNumpadDisabled(true);
            showLoading('8');

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('lang', lang);

                const res = await fetch('/api/upload-image', {
                    method: 'POST',
                    body: formData,
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || 'Server error');
                }
                const data = await res.json();
                showResponse('8', data.result);
                speak(data.result);
            } catch (err) {
                showError(t.errorGeneric(err.message));
            } finally {
                isLoading = false;
                setNumpadDisabled(false);
            }
        });

        fileInput.click();
    }

    function setNumpadDisabled(disabled) {
        numpadGrid.querySelectorAll('.numpad-btn').forEach(btn => {
            btn.disabled = disabled;
            btn.style.opacity = disabled ? '0.5' : '1';
        });
    }

    // ===== VOICE CHAT (Push-to-Talk on Button 9) =====

    async function startVoiceRecording() {
        if (isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                // Stop all mic tracks
                stream.getTracks().forEach(t => t.stop());

                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
                audioChunks = [];
                await sendVoiceChat(audioBlob);
            };

            mediaRecorder.start();
            isRecording = true;

            // Show recording UI
            responseIcon.textContent = '🎙️';
            responseText.innerHTML = t.voiceListening;
            responseArea.classList.remove('hidden');
            document.getElementById('display-area').classList.add('recording');
            const btnSubmit = document.getElementById('btn-submit');
            if (btnSubmit) btnSubmit.classList.add('recording-btn');

        } catch (err) {
            console.error('Mic access error:', err);
            showError(t.errorMic);
        }
    }

    function stopVoiceRecording() {
        if (!isRecording || !mediaRecorder) return;
        isRecording = false;
        mediaRecorder.stop();

        // Remove recording UI
        document.getElementById('display-area').classList.remove('recording');
        const btnSubmit = document.getElementById('btn-submit');
        if (btnSubmit) btnSubmit.classList.remove('recording-btn');
    }

    async function sendVoiceChat(audioBlob) {
        isLoading = true;
        setNumpadDisabled(true);

        responseIcon.textContent = '⏳';
        responseText.innerHTML = t.voiceProcessing;

        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');
            formData.append('lang', lang);

            const res = await fetch('/api/voice-chat', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Server error');
            }

            const data = await res.json();

            // Show transcription + response
            responseIcon.textContent = '🎙️';
            responseText.innerHTML =
                '<div style="margin-bottom:8px;color:rgba(134,239,172,0.6);font-size:0.85rem;">' + t.voiceYouSaid +
                data.transcription + '</div>' +
                '<div>' + data.response + '</div>';
            responseArea.classList.remove('hidden');

            // Speak the response in the selected language
            speak(data.response);

        } catch (err) {
            showError(t.errorGeneric(err.message));
        } finally {
            isLoading = false;
            setNumpadDisabled(false);
        }
    }

    // ===== EVENT LISTENERS =====

    // Numpad click (event delegation)
    numpadGrid.addEventListener('click', function (e) {
        const btn = e.target.closest('.numpad-btn');
        if (!btn || btn.disabled) return;

        const value = btn.getAttribute('data-value');

        // If recording, pressing OK stops it
        if (isRecording && value === 'OK') {
            stopVoiceRecording();
            return;
        }

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

    // ===== VOICE / TTS (selected language) =====
    // Uses a browser voice for the selected language when one exists.
    // Most desktop browsers have no Punjabi voice, so we fall back to
    // server-generated MP3 audio from /api/tts.
    const voiceBtn = document.getElementById('voice-greeting-btn');
    const voiceBtnIcon = document.getElementById('voice-btn-icon');
    const voiceBtnLabel = document.getElementById('voice-btn-label');
    let isSpeaking = false;

    const SPEECH_LANG = { hi: 'hi-IN', pa: 'pa-IN', en: 'en-IN' };
    const hasSpeechSynthesis = 'speechSynthesis' in window;

    // Pick the best browser voice for the active language, or null if none
    function getVoiceForLang() {
        if (!hasSpeechSynthesis) return null;
        const code = SPEECH_LANG[lang];
        const voices = window.speechSynthesis.getVoices();
        const norm = v => v.lang.replace('_', '-').toLowerCase();
        return voices.find(v => norm(v) === code.toLowerCase() && v.name.includes('Google'))
            || voices.find(v => norm(v) === code.toLowerCase())
            || voices.find(v => norm(v).startsWith(lang + '-') || norm(v) === lang)
            || null;
    }

    // --- Server TTS fallback (one shared <audio>, queued like speechSynthesis) ---
    const ttsAudio = new Audio();
    let ttsQueue = [];
    let ttsPlaying = false;
    let ttsGeneration = 0;     // bumped on stop, so in-flight audio is discarded
    let ttsObjectUrl = null;

    function fetchServerTTS(text, forLang) {
        return fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, lang: forLang }),
        }).then(res => {
            if (!res.ok) throw new Error('TTS request failed (' + res.status + ')');
            return res.blob();
        });
    }

    function speakViaServer(text, onEnd) {
        // Start fetching right away so queued items play back-to-back
        ttsQueue.push({ blob: fetchServerTTS(text, lang), onEnd: onEnd });
        if (!ttsPlaying) playNextServerTTS();
    }

    async function playNextServerTTS() {
        const item = ttsQueue.shift();
        if (!item) { ttsPlaying = false; return; }
        ttsPlaying = true;
        const gen = ttsGeneration;
        let finished = false;
        const done = () => {
            if (finished || gen !== ttsGeneration) return;
            finished = true;
            if (item.onEnd) item.onEnd();
            playNextServerTTS();
        };
        try {
            const blob = await item.blob;
            if (gen !== ttsGeneration) return;
            if (ttsObjectUrl) URL.revokeObjectURL(ttsObjectUrl);
            ttsObjectUrl = URL.createObjectURL(blob);
            ttsAudio.onended = done;
            ttsAudio.onerror = done;
            ttsAudio.src = ttsObjectUrl;
            await ttsAudio.play();
        } catch (err) {
            console.error('Server TTS failed:', err);
            done();
        }
    }

    // iOS Safari only lets an <audio> play later if it was first played
    // inside a tap, so prime the shared element on the language-button tap.
    function unlockAudio() {
        ttsAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        ttsAudio.play().catch(() => {});
    }

    // Speak text in the active language
    function speak(text, onEnd) {
        if (!text) { if (onEnd) onEnd(); return; }
        const voice = getVoiceForLang();
        if (!voice) {
            speakViaServer(text, onEnd);
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = SPEECH_LANG[lang];
        utterance.voice = voice;
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1;
        if (onEnd) utterance.onend = onEnd;
        window.speechSynthesis.speak(utterance);
    }

    function cancelAllSpeech() {
        if (hasSpeechSynthesis) window.speechSynthesis.cancel();
        ttsGeneration++;
        ttsQueue = [];
        ttsPlaying = false;
        ttsAudio.pause();
    }

    // Stop any ongoing speech
    function stopSpeaking() {
        cancelAllSpeech();
        setSpeakingState(false);
    }

    // Run cb once browser voices are known (they load async in Chrome).
    // Gives up waiting after a short timeout so the server fallback still works
    // on browsers that never fire 'voiceschanged'.
    function whenVoicesReady(cb) {
        if (!hasSpeechSynthesis || window.speechSynthesis.getVoices().length > 0) {
            cb();
            return;
        }
        let called = false;
        const run = () => {
            if (called) return;
            called = true;
            window.speechSynthesis.removeEventListener('voiceschanged', run);
            cb();
        };
        window.speechSynthesis.addEventListener('voiceschanged', run);
        setTimeout(run, 1500);
    }

    function speakGreeting() {
        // Toggle off if already speaking
        if (isSpeaking) {
            stopSpeaking();
            return;
        }

        cancelAllSpeech();
        setSpeakingState(true);

        const greetingText = t.greetingText;
        const menuText = t.greetingMenu;

        whenVoicesReady(() => {
            speak(greetingText);
            speak(menuText, () => setSpeakingState(false));
        });
    }

    function setSpeakingState(speaking) {
        isSpeaking = speaking;
        if (speaking) {
            voiceBtn.classList.add('speaking');
            voiceBtnIcon.textContent = '⏹️';
            voiceBtnLabel.textContent = t.voiceBtnStop;
        } else {
            voiceBtn.classList.remove('speaking');
            voiceBtnIcon.textContent = '🔊';
            voiceBtnLabel.textContent = t.voiceBtnLabel;
        }
    }

    voiceBtn.addEventListener('click', speakGreeting);

    // ===== INIT =====
    // Ask for voices early: Chrome loads them async and only after a first call
    if (hasSpeechSynthesis) window.speechSynthesis.getVoices();
    updateDisplay();

})();

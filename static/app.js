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
            liveListening: 'सुन रहा हूँ... बोलिए',
            liveHearing: 'आपकी बात सुन रहा हूँ...',
            liveThinking: 'सोच रहा हूँ...',
            liveSpeaking: 'जवाब दे रहा हूँ...',
            liveAiLabel: 'किसान मित्र: ',
            liveHint: '✓ = अभी भेजें / जवाब छोड़ें · C = कॉल खत्म करें',
            liveEnded: 'कॉल खत्म हुई। फिर से बात करने के लिए 9 और ✓ दबाएं।',
            liveIdleEnded: 'काफ़ी देर तक कोई आवाज़ नहीं आई, इसलिए कॉल खत्म कर दी गई। फिर से बात करने के लिए 9 और ✓ दबाएं।',
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
            liveListening: 'ਸੁਣ ਰਿਹਾ ਹਾਂ... ਬੋਲੋ',
            liveHearing: 'ਤੁਹਾਡੀ ਗੱਲ ਸੁਣ ਰਿਹਾ ਹਾਂ...',
            liveThinking: 'ਸੋਚ ਰਿਹਾ ਹਾਂ...',
            liveSpeaking: 'ਜਵਾਬ ਦੇ ਰਿਹਾ ਹਾਂ...',
            liveAiLabel: 'ਕਿਸਾਨ ਮਿੱਤਰ: ',
            liveHint: '✓ = ਹੁਣੇ ਭੇਜੋ / ਜਵਾਬ ਛੱਡੋ · C = ਕਾਲ ਖ਼ਤਮ ਕਰੋ',
            liveEnded: 'ਕਾਲ ਖ਼ਤਮ ਹੋਈ। ਦੁਬਾਰਾ ਗੱਲ ਕਰਨ ਲਈ 9 ਅਤੇ ✓ ਦਬਾਓ।',
            liveIdleEnded: 'ਕਾਫ਼ੀ ਦੇਰ ਕੋਈ ਆਵਾਜ਼ ਨਹੀਂ ਆਈ, ਇਸ ਲਈ ਕਾਲ ਖ਼ਤਮ ਕਰ ਦਿੱਤੀ ਗਈ। ਦੁਬਾਰਾ ਗੱਲ ਕਰਨ ਲਈ 9 ਅਤੇ ✓ ਦਬਾਓ।',
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
            liveListening: 'Listening... speak now',
            liveHearing: 'Hearing you...',
            liveThinking: 'Thinking...',
            liveSpeaking: 'Answering...',
            liveAiLabel: 'Kisan Mitra: ',
            liveHint: '✓ = send now / skip answer · C = end call',
            liveEnded: 'Call ended. Press 9 and ✓ to talk again.',
            liveIdleEnded: 'No one spoke for a while, so the call ended. Press 9 and ✓ to talk again.',
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

        // Option 9: live, hands-free conversation with the AI
        if (option === '9') {
            currentInput = '';
            updateDisplay();
            startLiveCall();
            return;
        }

        // Option 1: single push-to-talk question (press ✓ to stop recording)
        if (option === '1') {
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

    // Phone photos are often 3–8 MB; the vision model only accepts ~4 MB and
    // rural mobile data is slow, so downscale to a ~1024px JPEG before upload.
    // Falls back to the original file if the browser can't decode it.
    async function shrinkImage(file, maxSide = 1024, quality = 0.85) {
        try {
            const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
            const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(bitmap.width * scale);
            canvas.height = Math.round(bitmap.height * scale);
            canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            if (bitmap.close) bitmap.close();
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
            return blob || file;
        } catch (err) {
            console.warn('Could not shrink photo, uploading original:', err);
            return file;
        }
    }

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
                const photo = await shrinkImage(file);
                const formData = new FormData();
                formData.append('file', photo, photo === file ? file.name : 'photo.jpg');
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

    // ===== LIVE CALL (Option 9: hands-free conversation) =====
    // Press 9 + ✓ once to start. The app listens, notices when the farmer stops
    // talking (volume-based voice detection), sends that turn plus the
    // conversation so far to /api/voice-chat, speaks the reply, then listens
    // again. During a call: ✓ = send now / skip the spoken answer, C = hang up.
    const LIVE = {
        FRAME_MS: 50,              // how often the mic level is checked
        MIN_SPEECH_MS: 300,        // voice needed before a turn counts as speech
        END_SILENCE_MS: 1200,      // quiet after speech that ends the turn
        MAX_TURN_MS: 30000,        // send a turn after 30 s even without a pause
        PRE_SPEECH_RESET_MS: 8000, // drop audio recorded before anyone speaks
        IDLE_HANGUP_MS: 60000,     // hang up after a minute with no speech
        MIN_THRESHOLD: 0.015,      // lowest mic level (RMS) that counts as voice
        HISTORY_MESSAGES: 10,      // earlier messages sent for context
    };

    const live = {
        active: false,
        callId: 0,
        state: 'idle',             // 'listening' | 'thinking' | 'speaking'
        stream: null,
        audioCtx: null,
        analyser: null,
        levelBuf: null,
        timer: null,
        recorder: null,            // { rec: MediaRecorder, chunks: Blob[] }
        history: [],
        noiseFloor: 0.005,
        voicedMs: 0,
        silenceMs: 0,
        heardSpeech: false,
        turnStartedAt: 0,
        listenStartedAt: 0,
        lastSpeechAt: 0,
        speakingGuard: null,
    };

    function audioFileName(mimeType) {
        if (/mp4|m4a|aac/.test(mimeType)) return 'turn.m4a';
        if (/ogg/.test(mimeType)) return 'turn.ogg';
        if (/wav/.test(mimeType)) return 'turn.wav';
        return 'turn.webm';
    }

    async function startLiveCall() {
        if (live.active) return;
        stopSpeaking();
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
        } catch (err) {
            console.error('Mic access error:', err);
            showError(t.errorMic);
            return;
        }
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        live.audioCtx = new AudioCtx();
        if (live.audioCtx.state === 'suspended') live.audioCtx.resume().catch(() => {});
        live.analyser = live.audioCtx.createAnalyser();
        live.analyser.fftSize = 1024;
        live.audioCtx.createMediaStreamSource(stream).connect(live.analyser);
        live.levelBuf = new Float32Array(live.analyser.fftSize);
        live.stream = stream;
        live.active = true;
        live.callId++;
        live.history = [];
        live.noiseFloor = 0.005;
        live.lastSpeechAt = Date.now();
        responseArea.classList.remove('hidden');
        live.timer = setInterval(liveTick, LIVE.FRAME_MS);
        liveListen();
    }

    function startTurnRecorder() {
        const chunks = [];
        const rec = new MediaRecorder(live.stream);
        rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        live.recorder = { rec: rec, chunks: chunks };
        rec.start();
    }

    // Stop the current recorder; resolves with what it recorded (or null)
    function stopTurnRecorder() {
        const current = live.recorder;
        live.recorder = null;
        if (!current || current.rec.state === 'inactive') return Promise.resolve(null);
        return new Promise(resolve => {
            current.rec.onstop = () =>
                resolve(new Blob(current.chunks, { type: current.rec.mimeType || 'audio/webm' }));
            current.rec.stop();
        });
    }

    function liveListen() {
        if (!live.active) return;
        if (live.recorder) stopTurnRecorder();
        live.state = 'listening';
        live.voicedMs = 0;
        live.silenceMs = 0;
        live.heardSpeech = false;
        live.listenStartedAt = Date.now();
        startTurnRecorder();
        renderLive();
    }

    // Runs every FRAME_MS while listening: simple voice activity detection
    function liveTick() {
        if (!live.active || live.state !== 'listening') return;
        const now = Date.now();
        live.analyser.getFloatTimeDomainData(live.levelBuf);
        let sum = 0;
        for (let i = 0; i < live.levelBuf.length; i++) sum += live.levelBuf[i] * live.levelBuf[i];
        const rms = Math.sqrt(sum / live.levelBuf.length);
        const threshold = Math.max(LIVE.MIN_THRESHOLD, live.noiseFloor * 3);
        // Slightly lower bar once talking, so soft word endings don't cut the turn
        const voiced = rms > (live.heardSpeech ? threshold * 0.7 : threshold);

        if (voiced) {
            live.voicedMs += LIVE.FRAME_MS;
            live.silenceMs = 0;
            live.lastSpeechAt = now;
            if (!live.heardSpeech && live.voicedMs >= LIVE.MIN_SPEECH_MS) {
                live.heardSpeech = true;
                live.turnStartedAt = now;
                renderLive();
            }
        } else {
            live.silenceMs += LIVE.FRAME_MS;
            if (!live.heardSpeech) {
                // Learn the background noise level while nobody is talking
                live.noiseFloor = live.noiseFloor * 0.95 + rms * 0.05;
                live.voicedMs = Math.max(0, live.voicedMs - LIVE.FRAME_MS);
            }
        }

        if (live.heardSpeech) {
            if (live.silenceMs >= LIVE.END_SILENCE_MS || now - live.turnStartedAt >= LIVE.MAX_TURN_MS) {
                endLiveTurn();
            }
        } else if (now - live.lastSpeechAt >= LIVE.IDLE_HANGUP_MS) {
            endLiveCall(t.liveIdleEnded);
        } else if (now - live.listenStartedAt >= LIVE.PRE_SPEECH_RESET_MS && live.voicedMs === 0) {
            // Keep uploads short: throw away long stretches of silence
            stopTurnRecorder();
            startTurnRecorder();
            live.listenStartedAt = now;
        }
    }

    async function endLiveTurn() {
        if (!live.active || live.state !== 'listening') return;
        const callId = live.callId;
        const heard = live.heardSpeech;
        live.state = 'thinking';
        renderLive();

        const blob = await stopTurnRecorder();
        if (!live.active || live.callId !== callId) return;
        if (!heard || !blob || blob.size < 1000) { liveListen(); return; }

        const formData = new FormData();
        formData.append('file', blob, audioFileName(blob.type));
        formData.append('lang', lang);
        formData.append('history', JSON.stringify(live.history.slice(-LIVE.HISTORY_MESSAGES)));

        let data;
        try {
            const res = await fetch('/api/voice-chat', { method: 'POST', body: formData });
            if (res.status === 400) {
                // Nothing understandable was said: just keep listening
                if (live.active && live.callId === callId) liveListen();
                return;
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Server error');
            }
            data = await res.json();
        } catch (err) {
            if (live.active && live.callId === callId) endLiveCall(t.errorGeneric(err.message));
            return;
        }
        if (!live.active || live.callId !== callId) return;

        live.history.push(
            { role: 'user', content: data.transcription },
            { role: 'assistant', content: data.response },
        );
        live.lastSpeechAt = Date.now();
        live.state = 'speaking';
        renderLive();

        let resumed = false;
        const resume = () => {
            if (resumed) return;
            resumed = true;
            clearTimeout(live.speakingGuard);
            // Short pause so the tail of the reply isn't picked up by the mic
            setTimeout(() => {
                if (live.active && live.callId === callId && live.state === 'speaking') liveListen();
            }, 300);
        };
        // Safety net in case the browser never reports that speech finished
        live.speakingGuard = setTimeout(resume, 8000 + data.response.length * 120);
        speak(data.response, resume);
    }

    // ✓ during a call: send what was said so far, or skip the spoken answer
    function liveSendOrSkip() {
        if (live.state === 'listening') {
            live.heardSpeech = true;
            endLiveTurn();
        } else if (live.state === 'speaking') {
            live.state = 'skipping';
            clearTimeout(live.speakingGuard);
            cancelAllSpeech();
            liveListen();
        }
    }

    function endLiveCall(message) {
        if (!live.active) return;
        live.active = false;
        live.state = 'idle';
        clearInterval(live.timer);
        clearTimeout(live.speakingGuard);
        stopTurnRecorder();
        if (live.stream) live.stream.getTracks().forEach(track => track.stop());
        if (live.audioCtx) live.audioCtx.close().catch(() => {});
        live.stream = live.audioCtx = live.analyser = null;
        stopSpeaking();
        document.getElementById('display-area').classList.remove('recording');
        responseIcon.textContent = '📞';
        responseText.textContent = message || t.liveEnded;
        responseArea.classList.remove('hidden');
    }

    // Status line, the latest exchange, and the key hint
    function renderLive() {
        const listening = live.state === 'listening';
        document.getElementById('display-area').classList.toggle('recording', listening);
        responseIcon.textContent = { listening: '🎙️', thinking: '⏳', speaking: '🔊' }[live.state] || '📞';
        const status = {
            listening: live.heardSpeech ? t.liveHearing : t.liveListening,
            thinking: t.liveThinking,
            speaking: t.liveSpeaking,
        }[live.state] || '';

        responseText.textContent = '';
        const add = (className, text) => {
            const el = document.createElement('div');
            el.className = className;
            el.textContent = text;
            responseText.appendChild(el);
        };
        add('live-status', status);
        const last = live.history.slice(-2);
        if (last.length === 2) {
            add('live-you', t.voiceYouSaid + last[0].content);
            add('live-ai', t.liveAiLabel + last[1].content);
        }
        add('live-hint', t.liveHint);
    }

    // ===== EVENT LISTENERS =====

    // Numpad click (event delegation)
    numpadGrid.addEventListener('click', function (e) {
        const btn = e.target.closest('.numpad-btn');
        if (!btn || btn.disabled) return;

        const value = btn.getAttribute('data-value');

        // During a live call: ✓ = send now / skip answer, C = hang up
        if (live.active) {
            if (value === 'C') endLiveCall();
            else if (value === 'OK') liveSendOrSkip();
            return;
        }

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
        if (live.active) {
            if (e.key === 'Enter') { e.preventDefault(); liveSendOrSkip(); }
            else if (e.key === 'Escape' || e.key === 'Backspace' || e.key.toLowerCase() === 'c') {
                e.preventDefault();
                endLiveCall();
            }
            return;
        }
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
        if (live.active) endLiveCall();

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

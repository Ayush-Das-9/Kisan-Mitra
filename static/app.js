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
    const menuItems = document.querySelectorAll('.menu-item');

    // ===== STATE =====
    let currentInput = '';
    let isLoading = false;
    const MAX_DIGITS = 4;

    const menuMeta = {
        '1': { label: 'Crop Information', icon: '🌾' },
        '2': { label: 'Wheat News', icon: '📰' },
        '3': { label: 'Fertilizer Information', icon: '🧪' },
    };

    // ===== DISPLAY FUNCTIONS =====
    function updateDisplay() {
        displayValue.textContent = currentInput || '_';
        displayValue.classList.remove('pop');
        void displayValue.offsetWidth;
        displayValue.classList.add('pop');

        if (currentInput) {
            displayStatus.textContent = 'Press ✓ to confirm or C to clear';
            displayStatus.classList.add('active');
        } else {
            displayStatus.textContent = 'Press a number to begin';
            displayStatus.classList.remove('active');
        }

        highlightMenu(currentInput);
    }

    function highlightMenu(input) {
        menuItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-option') === input);
        });
    }

    function showLoading(option) {
        const meta = menuMeta[option] || { icon: '⏳', label: 'Loading' };
        responseIcon.textContent = '⏳';
        responseText.innerHTML = `<span class="loading-dots">Asking Gemini about <strong>${meta.label}</strong></span>`;
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

        // Only options 1–3 call Gemini
        if (!menuMeta[option]) {
            showError(`Option "${option}" is not available. Please enter 1, 2, or 3.`);
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
        } catch (err) {
            showError(`Error: ${err.message}. Please try again.`);
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

    // ===== INIT =====
    updateDisplay();

    // Staggered entrance for menu items
    menuItems.forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-12px)';
        setTimeout(() => {
            item.style.transition = 'all 400ms ease';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, 200 + i * 100);
    });

})();

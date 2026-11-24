/**
 * Kisan Mitra — one-time farm details form.
 * Details are kept only in this browser (localStorage). The farmer's name is
 * used for greetings and is never sent to the server (see forServer).
 * Exposes window.KisanProfile for app.js.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'kisanMitraProfile';
    const SELECT_FIELDS = ['state', 'land', 'main_crop', 'stage', 'soil', 'irrigation', 'method'];
    const CHECK_FIELDS = ['other_crops', 'livestock'];
    // Order the fields appear in the form
    const FORM_ORDER = ['name', 'state', 'district', 'land', 'main_crop', 'other_crops',
                        'stage', 'soil', 'irrigation', 'method', 'livestock'];

    let memory = null;          // used when browser storage is unavailable
    let options = null;         // fields from /api/profile-options
    let optionsPromise = null;

    // ----- storage -----
    function load() {
        if (memory) return memory;
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                memory = parsed;
                return parsed;
            }
        } catch (err) {
            console.warn('Could not read saved farm details:', err);
        }
        return null;
    }

    function write(value) {
        memory = value;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        } catch (err) {
            // Private mode / storage full: keep it for this visit only
            console.warn('Could not save farm details:', err);
        }
    }

    function save(profile) { write(profile); }
    function skip() { write({ skipped: true }); }

    // Copy for the server: never includes the name
    function forServer(profile) {
        if (!profile || profile.skipped) return {};
        const copy = Object.assign({}, profile);
        delete copy.name;
        delete copy.skipped;
        return copy;
    }

    // ----- choice lists -----
    function loadOptions() {
        if (!optionsPromise) {
            optionsPromise = fetch('/api/profile-options')
                .then(res => {
                    if (!res.ok) throw new Error('profile options ' + res.status);
                    return res.json();
                })
                .then(data => { options = data.fields; return options; })
                .catch(err => { optionsPromise = null; throw err; });
        }
        return optionsPromise;
    }

    function optionsLoaded() { return options !== null; }

    function choiceLabel(field, key, lang) {
        const list = options && options[field];
        const item = list && list.find(c => c.key === key);
        if (!item) return key;
        return item.label[lang] || item.label.en || key;
    }

    // ----- form -----
    function el(tag, attrs, text) {
        const node = document.createElement(tag);
        Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function buildField(field, lang, texts, existing) {
        const wrap = el('div', { class: 'profile-field' });
        const id = 'profile-' + field;

        if (CHECK_FIELDS.includes(field)) {
            const fieldset = el('fieldset', { class: 'profile-checks' });
            fieldset.appendChild(el('legend', {}, texts.fields[field]));
            const chosen = existing[field] || [];
            options[field].forEach(choice => {
                const label = el('label', { class: 'profile-check' });
                const box = el('input', { type: 'checkbox', name: field, value: choice.key });
                box.checked = chosen.includes(choice.key);
                label.appendChild(box);
                label.appendChild(document.createTextNode(' ' + (choice.label[lang] || choice.label.en)));
                fieldset.appendChild(label);
            });
            wrap.appendChild(fieldset);
            return wrap;
        }

        wrap.appendChild(el('label', { for: id }, texts.fields[field]));
        if (SELECT_FIELDS.includes(field)) {
            const select = el('select', { id: id, name: field });
            select.appendChild(el('option', { value: '' }, texts.choose));
            options[field].forEach(choice => {
                const opt = el('option', { value: choice.key }, choice.label[lang] || choice.label.en);
                if (existing[field] === choice.key) opt.selected = true;
                select.appendChild(opt);
            });
            wrap.appendChild(select);
        } else {
            const input = el('input', {
                id: id, name: field, type: 'text', autocomplete: 'off',
                maxlength: field === 'district' ? '60' : '40',
                placeholder: field === 'name' ? texts.namePlaceholder : texts.districtPlaceholder,
            });
            input.value = existing[field] || '';
            wrap.appendChild(input);
        }
        return wrap;
    }

    function readForm(form) {
        const profile = {};
        ['name', 'district'].forEach(field => {
            const value = form.elements[field].value.trim();
            if (value) profile[field] = value;
        });
        SELECT_FIELDS.forEach(field => {
            const value = form.elements[field].value;
            if (value) profile[field] = value;
        });
        CHECK_FIELDS.forEach(field => {
            const values = Array.from(form.querySelectorAll('input[name="' + field + '"]:checked'))
                .map(box => box.value)
                .filter(v => !(field === 'other_crops' && v === profile.main_crop));
            if (values.length) profile[field] = values;
        });
        return profile;
    }

    /**
     * Show the form. onDone(profile) after Save, onDone(null) after Skip/Cancel.
     * If the choice lists can't be loaded, the form is skipped for this visit.
     */
    async function showForm({ lang, texts, existing, onDone }) {
        const screen = document.getElementById('profile-screen');
        const editing = !!(existing && !existing.skipped);
        const current = editing ? existing : {};
        try {
            await loadOptions();
        } catch (err) {
            console.error('Could not load the farm details form:', err);
            onDone(null);
            return;
        }

        screen.textContent = '';
        const form = el('form', { class: 'profile-card', novalidate: '' });
        form.appendChild(el('h2', { class: 'profile-title' }, texts.title));
        form.appendChild(el('p', { class: 'profile-subtitle' }, texts.subtitle));
        FORM_ORDER.forEach(field => form.appendChild(buildField(field, lang, texts, current)));

        const buttons = el('div', { class: 'profile-buttons' });
        const saveBtn = el('button', { type: 'submit', class: 'profile-save' }, texts.save);
        const skipBtn = el('button', { type: 'button', class: 'profile-skip' }, editing ? texts.cancel : texts.skip);
        buttons.appendChild(saveBtn);
        buttons.appendChild(skipBtn);
        form.appendChild(buttons);
        screen.appendChild(form);

        const close = () => { screen.style.display = 'none'; screen.textContent = ''; };
        form.addEventListener('submit', e => {
            e.preventDefault();
            const profile = readForm(form);
            save(profile);
            close();
            onDone(profile);
        });
        skipBtn.addEventListener('click', () => {
            if (!editing) skip();
            close();
            onDone(null);
        });

        screen.style.display = '';
        screen.scrollTop = 0;
    }

    window.KisanProfile = { load, save, skip, forServer, loadOptions, optionsLoaded, choiceLabel, showForm };
})();

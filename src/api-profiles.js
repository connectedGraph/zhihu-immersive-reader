    function createApiProfileId() {
        return `api-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    }

    function getApiProfileStoreFallback() {
        const id = createApiProfileId();
        return {
            activeId: id,
            profiles: [{
                id,
                name: '默认配置',
                apiHost: config.apiHost || DEFAULT_CONFIG.apiHost,
                apiModel: config.apiModel || DEFAULT_CONFIG.apiModel,
                apiKey: config.apiKey || '',
                updatedAt: new Date().toISOString()
            }]
        };
    }

    function normalizeApiProfileStore(store) {
        const fallback = getApiProfileStoreFallback();
        const profiles = Array.isArray(store?.profiles)
            ? store.profiles.map((profile, index) => ({
                id: profile.id || createApiProfileId(),
                name: String(profile.name || `API 配置 ${index + 1}`).trim(),
                apiHost: String(profile.apiHost || '').trim(),
                apiModel: String(profile.apiModel || '').trim(),
                apiKey: String(profile.apiKey || '').trim(),
                updatedAt: profile.updatedAt || new Date().toISOString()
            })).filter(profile => profile.apiHost || profile.apiModel || profile.apiKey || profile.name)
            : [];
        if (!profiles.length) return fallback;
        const activeId = profiles.some(profile => profile.id === store?.activeId) ? store.activeId : profiles[0].id;
        return { activeId, profiles };
    }

    function loadApiProfiles() {
        try {
            let raw = null;
            if (typeof GM_getValue === 'function') raw = GM_getValue(API_PROFILES_KEY, null);
            if (!raw) raw = localStorage.getItem(API_PROFILES_KEY);
            const store = normalizeApiProfileStore(raw ? JSON.parse(raw) : null);
            if (typeof GM_setValue === 'function' && raw) GM_setValue(API_PROFILES_KEY, typeof raw === 'string' ? raw : JSON.stringify(store));
            return store;
        } catch (err) {
            console.warn('知乎沉浸式阅读：API 配置组读取失败', err);
            return getApiProfileStoreFallback();
        }
    }

    function saveApiProfiles(store) {
        const normalized = normalizeApiProfileStore(store);
        const json = JSON.stringify(normalized);
        if (typeof GM_setValue === 'function') GM_setValue(API_PROFILES_KEY, json);
        localStorage.setItem(API_PROFILES_KEY, json);
        return normalized;
    }

    function readApiProfileNameFromForm() {
        return (document.getElementById('zh-api-profile-name')?.value || '').trim();
    }

    function getSelectedApiProfile(store = loadApiProfiles()) {
        const selectedId = document.getElementById('zh-api-profile-select')?.value || store.activeId;
        return store.profiles.find(profile => profile.id === selectedId) || store.profiles[0] || null;
    }

    function setApiProfileStatus(message) {
        const status = document.getElementById('zh-api-profile-status');
        if (status) status.textContent = message;
    }

    function fillApiFormFromProfile(profile) {
        if (!profile) return;
        const hostEl = document.getElementById('zh-cfg-host');
        const modelEl = document.getElementById('zh-cfg-model');
        const keyEl = document.getElementById('zh-cfg-key');
        const nameEl = document.getElementById('zh-api-profile-name');
        if (hostEl) hostEl.value = profile.apiHost || '';
        if (modelEl) modelEl.value = profile.apiModel || '';
        if (keyEl) keyEl.value = profile.apiKey || '';
        if (nameEl) nameEl.value = profile.name || '';
    }

    function renderApiProfileControls(store = loadApiProfiles()) {
        const select = document.getElementById('zh-api-profile-select');
        const nameEl = document.getElementById('zh-api-profile-name');
        if (!select || !nameEl) return store;
        select.innerHTML = store.profiles.map(profile => `<option value="${escapeHTML(profile.id)}" ${profile.id === store.activeId ? 'selected' : ''}>${escapeHTML(profile.name || '未命名配置')}</option>`).join('');
        const active = store.profiles.find(profile => profile.id === store.activeId) || store.profiles[0];
        nameEl.value = active?.name || '';
        return store;
    }

    function getApiProfileFromForm(existingId = '') {
        return {
            id: existingId || createApiProfileId(),
            name: readApiProfileNameFromForm() || '未命名配置',
            ...readApiSettingsFromForm(),
            updatedAt: new Date().toISOString()
        };
    }

    function bindApiProfileControls() {
        let store = renderApiProfileControls(loadApiProfiles());
        const select = document.getElementById('zh-api-profile-select');

        select?.addEventListener('change', () => {
            store = loadApiProfiles();
            const selected = getSelectedApiProfile(store);
            const nameEl = document.getElementById('zh-api-profile-name');
            if (nameEl) nameEl.value = selected?.name || '';
            setApiProfileStatus(selected ? `已选择：${selected.name}` : '暂无可用配置。');
        });

        document.getElementById('zh-api-profile-apply')?.addEventListener('click', () => {
            store = loadApiProfiles();
            const selected = getSelectedApiProfile(store);
            if (!selected) return setApiProfileStatus('暂无可应用配置。');
            fillApiFormFromProfile(selected);
            store.activeId = selected.id;
            store = saveApiProfiles(store);
            saveConfig({ apiHost: selected.apiHost, apiModel: selected.apiModel, apiKey: selected.apiKey });
            renderApiProfileControls(store);
            setApiProfileStatus(`已应用配置：${selected.name}`);
        });

        document.getElementById('zh-api-profile-save')?.addEventListener('click', () => {
            store = loadApiProfiles();
            const selected = getSelectedApiProfile(store);
            const profile = getApiProfileFromForm(selected?.id);
            const index = store.profiles.findIndex(item => item.id === profile.id);
            if (index >= 0) store.profiles[index] = profile;
            else store.profiles.unshift(profile);
            store.activeId = profile.id;
            store = saveApiProfiles(store);
            renderApiProfileControls(store);
            setApiProfileStatus(`已保存配置：${profile.name}`);
        });

        document.getElementById('zh-api-profile-new')?.addEventListener('click', () => {
            store = loadApiProfiles();
            const profile = getApiProfileFromForm();
            profile.name = readApiProfileNameFromForm() || `API 配置 ${store.profiles.length + 1}`;
            store.profiles.unshift(profile);
            store.activeId = profile.id;
            store = saveApiProfiles(store);
            renderApiProfileControls(store);
            setApiProfileStatus(`已新建配置：${profile.name}`);
        });

        document.getElementById('zh-api-profile-delete')?.addEventListener('click', () => {
            store = loadApiProfiles();
            const selected = getSelectedApiProfile(store);
            if (!selected) return setApiProfileStatus('暂无可删除配置。');
            if (store.profiles.length <= 1) return setApiProfileStatus('至少保留一个 API 配置。');
            if (!confirm(`确认删除配置「${selected.name}」？`)) return;
            store.profiles = store.profiles.filter(profile => profile.id !== selected.id);
            store.activeId = store.profiles[0]?.id || '';
            store = saveApiProfiles(store);
            renderApiProfileControls(store);
            setApiProfileStatus('配置已删除。');
        });
    }

    const FEED_PREFETCH_GROUP_COUNT = 3;
    const FEED_LOAD_MIN_DELAY = 400;
    const FEED_LOAD_MAX_DELAY = 700;
    let _feedScrollController = null;

    function createFeedPrefetchManager(options) {
        const targetGroupCount = Math.max(1, options.targetGroupCount || FEED_PREFETCH_GROUP_COUNT);
        let fillPromise = null;
        let lastError = null;
        let waiters = [];

        const getState = () => options.getState();
        const getQueue = () => {
            const state = getState();
            state.prefetchedGroups = options.normalizeGroups(state.prefetchedGroups || []);
            return state.prefetchedGroups;
        };
        const persist = () => options.persist?.();
        const notifyWaiters = () => {
            const pending = waiters;
            waiters = [];
            pending.forEach(resolve => resolve());
        };
        const waitForQueueChange = () => new Promise(resolve => waiters.push(resolve));
        const getExistingKeys = () => {
            const keys = new Set(options.getVisibleKeys?.() || []);
            getQueue().flat().forEach(item => {
                if (item?.key) keys.add(item.key);
            });
            return keys;
        };

        const fillQueue = async () => {
            const state = getState();
            state.prefetching = true;
            state.prefetchError = '';
            lastError = null;
            try {
                while (getQueue().length < targetGroupCount && !state.exhausted) {
                    const batch = await options.fetchBatch(options.batchSize, getExistingKeys());
                    if (!batch.length) {
                        state.exhausted = true;
                        break;
                    }
                    getQueue().push(batch.slice(0, options.batchSize));
                    persist();
                    notifyWaiters();
                }
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                state.prefetchError = lastError.message || '网络请求失败';
            } finally {
                state.prefetching = false;
                fillPromise = null;
                persist();
                notifyWaiters();
            }
        };

        const ensureBuffered = () => {
            const state = getState();
            if (getQueue().length >= targetGroupCount || state.exhausted) return Promise.resolve();
            if (!fillPromise) fillPromise = fillQueue();
            return fillPromise;
        };

        const takeNext = async () => {
            while (true) {
                const state = getState();
                const queue = getQueue();
                if (queue.length) {
                    const group = queue.shift() || [];
                    state.prefetchError = '';
                    lastError = null;
                    persist();
                    void ensureBuffered();
                    return group;
                }
                if (state.exhausted) return [];

                void ensureBuffered();
                await waitForQueueChange();
                if (!getQueue().length && lastError) {
                    const error = lastError;
                    lastError = null;
                    throw error;
                }
            }
        };

        return {
            state: getState(),
            ensureBuffered,
            takeNext,
            bufferedCount: () => getQueue().length,
            hasNext: () => getQueue().length > 0 || !getState().exhausted,
            isWaitingForNetwork: () => getQueue().length === 0 && !!fillPromise
        };
    }

    function disconnectFeedScrollController() {
        const controller = _feedScrollController;
        if (!controller) return;
        controller.destroy();
        if (_feedScrollController === controller) _feedScrollController = null;
    }

    function setupFeedScrollController({ sentinel, onLoadNext, onCommit, hasNext, labels = {} }) {
        if (!sentinel?.isConnected || typeof onLoadNext !== 'function' || typeof onCommit !== 'function') return null;
        disconnectFeedScrollController();

        sentinel.innerHTML = '';
        sentinel.className = 'zh-feed-load-gate';
        sentinel.setAttribute('aria-live', 'polite');
        sentinel.setAttribute('role', 'progressbar');
        sentinel.setAttribute('aria-valuemin', '0');
        sentinel.setAttribute('aria-valuemax', '100');
        sentinel.setAttribute('aria-valuenow', '0');
        const indicator = document.createElement('span');
        indicator.className = 'zh-feed-load-indicator';
        indicator.setAttribute('aria-hidden', 'true');
        const progressRing = document.createElement('span');
        progressRing.className = 'zh-feed-load-ring';
        const progressValue = document.createElement('span');
        progressValue.className = 'zh-feed-load-value';
        progressValue.textContent = '0%';
        progressRing.appendChild(progressValue);
        indicator.appendChild(progressRing);
        const status = document.createElement('span');
        status.className = 'zh-feed-load-label';
        sentinel.appendChild(indicator);
        sentinel.appendChild(status);

        const controller = {
            destroyed: false,
            loading: false,
            distance: 0,
            threshold: Math.max(1, Math.round((window.innerHeight || document.documentElement.clientHeight || 720) * 0.5)),
            releaseTimer: null,
            lastTouchY: null,
            requestAdvance: null,
            retry: null,
            destroy: null
        };

        const gateIsVisible = () => {
            const rect = sentinel.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
            return rect.top <= viewportHeight + 4 && rect.bottom >= viewportHeight - 150;
        };

        const pinGateToViewport = () => {
            requestAnimationFrame(() => {
                if (controller.destroyed || (!sentinel.classList.contains('is-pulling') && !controller.loading)) return;
                const height = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0);
                window.scrollTo(0, Math.max(0, height - (window.innerHeight || 0)));
            });
        };

        const clearReleaseTimer = () => {
            if (controller.releaseTimer === null) return;
            clearTimeout(controller.releaseTimer);
            controller.releaseTimer = null;
        };

        const enableScrollSnap = () => {
            if (controller.destroyed) return;
            document.documentElement.classList.add('zh-feed-scroll-snap');
        };

        const setPullRatio = ratio => {
            const safeRatio = Math.max(0, Math.min(1, ratio));
            const percent = Math.round(safeRatio * 100);
            sentinel.style.setProperty('--zh-feed-pull-ratio', String(safeRatio));
            sentinel.style.setProperty('--zh-feed-progress-angle', `${safeRatio * 360}deg`);
            sentinel.style.height = `${Math.round(104 * safeRatio)}px`;
            sentinel.setAttribute('aria-valuenow', String(percent));
            progressValue.textContent = `${percent}%`;
        };

        const resetGate = () => {
            if (controller.loading || controller.destroyed) return;
            clearReleaseTimer();
            controller.distance = 0;
            setPullRatio(0);
            sentinel.classList.remove('is-pulling', 'is-error');
            sentinel.setAttribute('aria-busy', 'false');
            status.textContent = '';
        };

        const scheduleRelease = () => {
            clearReleaseTimer();
            controller.releaseTimer = setTimeout(resetGate, 260);
        };

        const requestAdvance = async () => {
            if (controller.destroyed || controller.loading || !sentinel.isConnected) return;
            clearReleaseTimer();
            controller.loading = true;
            sentinel.classList.remove('is-pulling', 'is-error');
            sentinel.classList.add('is-loading');
            setPullRatio(1);
            sentinel.setAttribute('aria-busy', 'true');
            progressValue.textContent = '...';
            status.textContent = labels.loading || '正在准备下一组...';
            pinGateToViewport();

            const simulatedDelay = FEED_LOAD_MIN_DELAY
                + Math.round(Math.random() * (FEED_LOAD_MAX_DELAY - FEED_LOAD_MIN_DELAY));
            try {
                const [result] = await Promise.all([
                    onLoadNext(controller, status),
                    new Promise(resolve => setTimeout(resolve, simulatedDelay))
                ]);
                if (controller.destroyed) return;
                await onCommit(result, controller, status);
            } catch (error) {
                if (controller.destroyed) return;
                controller.loading = false;
                controller.distance = 0;
                sentinel.classList.remove('is-loading');
                sentinel.classList.add('is-error');
                setPullRatio(0.72);
                sentinel.setAttribute('aria-busy', 'false');
                status.textContent = labels.error || '网络未跟上，继续向下滚动重试';
                scheduleRelease();
            }
        };

        const recordPull = delta => {
            if (controller.destroyed || controller.loading || !Number.isFinite(delta) || delta <= 0) return;
            if (typeof hasNext === 'function' && !hasNext()) {
                void onCommit([], controller, status);
                return;
            }
            controller.distance = Math.min(controller.threshold, controller.distance + delta);
            const ratio = controller.distance / controller.threshold;
            sentinel.classList.remove('is-error');
            sentinel.classList.add('is-pulling');
            setPullRatio(ratio);
            status.textContent = ratio >= 0.72
                ? (labels.release || '再滚动一点即可切换')
                : (labels.pull || '继续向下滚动');
            pinGateToViewport();
            scheduleRelease();
            if (ratio >= 1) void requestAdvance();
        };

        const onWheel = event => {
            if (controller.destroyed || controller.loading) return;
            if (event.deltaY !== 0) enableScrollSnap();
            if (event.deltaY < 0) {
                resetGate();
                return;
            }
            if (event.deltaY <= 0 || !gateIsVisible()) return;
            event.preventDefault();
            const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? (window.innerHeight || 1) : 1;
            recordPull(event.deltaY * unit);
        };

        const onTouchStart = event => {
            controller.lastTouchY = event.touches[0]?.clientY ?? null;
        };

        const onTouchMove = event => {
            const touchY = event.touches[0]?.clientY;
            if (!Number.isFinite(touchY) || !Number.isFinite(controller.lastTouchY)) return;
            const delta = controller.lastTouchY - touchY;
            controller.lastTouchY = touchY;
            if (delta !== 0) enableScrollSnap();
            if (delta < 0) {
                resetGate();
                return;
            }
            if (delta <= 0 || !gateIsVisible()) return;
            event.preventDefault();
            recordPull(delta);
        };

        const onResize = () => {
            const previousThreshold = controller.threshold;
            controller.threshold = Math.max(1, Math.round((window.innerHeight || document.documentElement.clientHeight || 720) * 0.5));
            if (!controller.distance || controller.loading) return;
            controller.distance = Math.min(controller.threshold, controller.distance * controller.threshold / previousThreshold);
            setPullRatio(controller.distance / controller.threshold);
        };

        controller.requestAdvance = requestAdvance;
        controller.retry = requestAdvance;
        controller.destroy = () => {
            if (controller.destroyed) return;
            controller.destroyed = true;
            clearReleaseTimer();
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('resize', onResize);
            document.documentElement.classList.remove('zh-feed-scroll-snap');
            sentinel.classList.remove('is-pulling', 'is-loading', 'is-error');
            sentinel.style.removeProperty('--zh-feed-pull-ratio');
            sentinel.style.removeProperty('--zh-feed-progress-angle');
            sentinel.style.removeProperty('height');
        };

        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('resize', onResize, { passive: true });
        _feedScrollController = controller;
        return controller;
    }

    function getFeedAnchorScrollTop(element) {
        if (!element) return 0;
        if (typeof element.getBoundingClientRect === 'function') {
            return Math.max(0, Math.round(element.getBoundingClientRect().top + window.scrollY - 12));
        }
        return Math.max(0, Number(element.offsetTop) || 0);
    }

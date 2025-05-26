document.addEventListener('DOMContentLoaded', function () {
    const transitionElement = document.getElementById('pageTransition');
    const contentWrapper = document.getElementById('contentWrapper');
    const body = document.body;

    // Configurações
    const config = {
        fadeInDuration: 500,
        fadeOutDuration: 700,
        minimumLoaderTime: 1200,
        contentFadeDelay: 300,
        minDataDelay: 500, // Ensure transition is visible
        maxDataWait: 5000 // Timeout for data loading
    };

    function showContent() {
        body.classList.add('page-loaded');

        setTimeout(() => {
            if (contentWrapper) contentWrapper.classList.add('show');

            setTimeout(() => {
                if (transitionElement) transitionElement.classList.add('hide');

                setTimeout(() => {
                    if (transitionElement) transitionElement.style.display = 'none';
                }, config.fadeOutDuration);
            }, config.contentFadeDelay);
        }, 100);
    }

    function startPageTransition(url) {
        if (body.classList.contains('transitioning')) return;
        body.classList.add('transitioning');

        if (transitionElement) transitionElement.style.display = 'flex';
        if (contentWrapper) contentWrapper.classList.remove('show');

        setTimeout(() => {
            transitionElement.classList.remove('hide');

            setTimeout(() => {
                window.location.href = url;
            }, config.fadeInDuration);
        }, 10);
    }

    function shouldInterceptLink(link) {
        return link && link.href &&
            !link.hash &&
            !link.classList.contains('no-transition') &&
            link.href.indexOf('javascript:') === -1 &&
            link.href.indexOf('mailto:') === -1 &&
            link.href.indexOf('tel:') === -1 &&
            link.href.indexOf('#') === -1 &&
            link.target !== '_blank' &&
            link.href.indexOf(window.location.host) !== -1 &&
            (link.href.split('?')[0].endsWith('.html') || link.href.split('?')[0].endsWith('/'));
    }

    document.addEventListener('click', function (e) {
        const target = e.target.closest('a');
        if (target && shouldInterceptLink(target)) {
            e.preventDefault();
            startPageTransition(target.href);
        }
    }, true);

    window.addEventListener('pageshow', function (event) {
        if (event.persisted && transitionElement) {
            transitionElement.style.display = 'none';
            if (contentWrapper) contentWrapper.classList.add('show');
            body.classList.add('page-loaded');
        }
    });

    // Check if on /docentes or /admin page
    if (window.location.pathname === '/docentes' ||
        window.location.pathname === '/admin') {
        const startTime = Date.now();
        const dataLoadTimeout = setTimeout(() => {
            console.warn('Data load timeout, showing content');
            showContent();
        }, config.maxDataWait);

        document.addEventListener('dataLoaded', () => {
            console.log('dataLoaded event received for', window.location.pathname);
            const elapsed = Date.now() - startTime;
            const remainingDelay = config.minDataDelay - elapsed;
            // Ensure minimum visibility
            setTimeout(() => {
                clearTimeout(dataLoadTimeout);
                showContent();
            }, remainingDelay > 0 ? remainingDelay : 0);
        }, { once: true });
    } else if (document.readyState === 'complete') {
        showContent();
    } else {
        window.addEventListener('load', showContent);
    }
});
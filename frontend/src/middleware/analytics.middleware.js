const http = require('http');

const trackAnalytics = (req, res, next) => {
    next(); // Негайно передаємо управління далі, щоб не затримувати завантаження сторінки

    setImmediate(() => {
        try {
            // Ігноруємо запити до статики (css, js, картинки), логуємо тільки сторінки/маршрути
            if (req.originalUrl.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$/i)) {
                return;
            }

            let token = 'no';
            let userId = 'no';
            let role = 'no';

            // Очищаємо URL від GET-параметрів для точної перевірки
            const path = req.originalUrl.split('?')[0];

            // 1. Правило для сторінок логіну та реєстрації
            if (path === '/auth/login' || path === '/auth/register') {
                token = 'no';
                userId = 'no';
                role = 'no';
            } else {
                // 2. Для всіх інших сторінок беремо дані з Cookie (якщо вони є)
                token = req.cookies?.token || 'no';
                userId = req.cookies?.userId || 'no';
                role = req.cookies?.role || 'no';
            }

            // Формуємо payload для PHP-мікросервісу
            const payload = JSON.stringify({
                url: req.originalUrl,
                user_agent: req.headers['user-agent'] || 'Unknown',
                referer: req.headers['referer'] || 'Direct',
                ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
                token: token,
                userId: String(userId),
                role: role
            });

            // Відправляємо POST-запит до PHP-контейнера
            const options = {
                hostname: 'analytics_microservice', // Назва контейнера з docker-compose.yml
                port: 80,
                path: '/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            };

            const request = http.request(options);
            request.on('error', (e) => {
                console.error('[Analytics Error] Неможливо відправити лог до PHP:', e.message);
            });
            request.write(payload);
            request.end();

        } catch (err) {
            console.error('[Analytics Fatal Error]:', err);
        }
    });
};

module.exports = trackAnalytics;
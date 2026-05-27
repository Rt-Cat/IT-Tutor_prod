# Production Dockerfile for Express.js Backend
FROM node:20-alpine

WORKDIR /usr/src/app

# Встановлюємо змінну середовища для продакшну одразу
ENV NODE_ENV=production

# Копіюємо маніфести пакетів
COPY package*.json ./

# Встановлюємо ТІЛЬКИ продакшн-залежності (пропускаємо nodemon, eslint тощо)
RUN npm install --omit=dev

# Копіюємо решту вихідного коду
COPY . .

# Безпека: створюємо не-root користувача для роботи сервера
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs && \
    chown -R expressjs:nodejs /usr/src/app

USER expressjs

# Відкриваємо порт
EXPOSE 5000

ENV PORT=5000
ENV HOST=0.0.0.0

# Запускаємо оптимізований сервер через стандартний node
CMD ["npm", "run", "start"]
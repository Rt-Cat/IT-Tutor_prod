FROM node:20-alpine

WORKDIR /usr/src/app

# Копіюємо файли конфігурації залежностей
COPY package*.json ./

# Встановлюємо всі пакети всередині контейнера
RUN npm install

# Копіюємо решту вихідного коду
COPY . .

EXPOSE 3000

# Явно викликаємо nodemon з локального бінарного шляху node_modules
CMD ["./node_modules/.bin/nodemon", "server.js"]
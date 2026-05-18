FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
# Dynamic port fallback dictated by docker-compose environment variables
EXPOSE ${PORT}
CMD ["npm", "run", "dev"]
# Use the official Node.js 20 LTS light alpine image as our base
FROM node:20-alpine

# Set the working directory inside the container workspace
WORKDIR /usr/src/app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install production and development dependencies clean
RUN npm install

# Copy the rest of your application source code into the container
COPY . .

# Expose the API engine port matching your compose and server environment config
EXPOSE 5000

# Fire up the container using the development nodemon script specified in package.json
CMD ["npm", "run", "dev"]
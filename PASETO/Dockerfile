# Set base image
FROM node:19-alpine3.16

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose ports
EXPOSE 8080
EXPOSE 8181

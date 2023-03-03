# Set base image
FROM node:14-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose ports
EXPOSE 4000
EXPOSE 3000

# Start the app
CMD ["sh", "-c", "npm run devStart2 && npm run devStart2"]
##RUN npm run devStart && npm run devStart2

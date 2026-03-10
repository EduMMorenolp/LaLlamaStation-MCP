# Use Node.js as the base image
FROM node:22-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Use Nginx to serve the build
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Default Vite port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

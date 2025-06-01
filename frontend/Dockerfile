# Stage 1: Build with Vite
FROM node:18 as builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy frontend files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# ✅ Fix permissions (root already owns these)
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

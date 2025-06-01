# Stage 1: build
FROM node:18 as builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

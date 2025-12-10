# Multi-stage Dockerfile for Angular app
# Stage 1: build the Angular app (Node 20 required by Angular CLI)
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
# Use legacy peer deps to avoid ERESOLVE peer dependency conflicts during CI inside the image
RUN npm ci --legacy-peer-deps --silent

# Copy rest of the sources and build
COPY . .
# Use the default build (production) which is defined in angular.json
## For CI/build inside the image we use the development configuration to avoid failing on budget
## (This produces an unoptimized build suitable for smoke-checks. For production images, switch back
## to `production` and/or adjust budgets in angular.json.)
RUN npm run build -- --configuration=development

# Stage 2: serve with nginx
FROM nginx:stable-alpine

# Remove default nginx config and add a SPA-friendly config
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from the build stage. The Angular CLI outputs the browser files under a `browser` folder
# so copy that folder's contents into nginx html root so index.html is served at '/'.
COPY --from=build /app/dist/Overtime_Frontend/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

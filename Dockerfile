# ================================================================
# Dockerfile — Multi-stage production build for the Vite/React SPA
# ================================================================

# ────────────────────────────────────────────────────────────────
# STAGE 1 — Builder
# Installs dependencies, injects build-time environment variables,
# and compiles the Vite application into static files.
# ────────────────────────────────────────────────────────────────
FROM node:22-slim AS builder

# Declare build-time arguments.
# Values are supplied at `docker build` time via --build-arg flags
# (or via CI/CD secrets). They are intentionally left blank here so
# that no URL is ever hard-coded into the image.
ARG VITE_API_BASE_URL

# Expose the ARG as an environment variable so that Vite's import.meta.env.*
# replacement picks it up during the build step.
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Set a clean working directory
WORKDIR /app

# Copy dependency manifests first to leverage Docker's layer cache:
# if package.json / package-lock.json haven't changed, the npm ci
# step is skipped entirely on subsequent builds.
COPY package.json package-lock.json ./

# Install exact versions from the lock file.
# `npm ci` is inherently frozen — it fails if package-lock.json is missing
# or out of sync with package.json. --frozen-lockfile is a yarn flag and is
# invalid for npm, causing exit code 1.
RUN npm ci

# Copy the rest of the source code
COPY . .

# Run the production build.
# `tsc -b && vite build` is defined in package.json → scripts.build.
# Vite reads VITE_* environment variables at this point and bakes the
# resolved values into the emitted JS bundle.
RUN npm run build

# ────────────────────────────────────────────────────────────────
# STAGE 2 — Runner
# Copies only the compiled static assets into a minimal Nginx image.
# No Node.js runtime, no source code, no secrets land in this image.
# ────────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Remove the default Nginx configuration so our custom one takes precedence
RUN rm /etc/nginx/conf.d/default.conf

# Copy the custom Nginx configuration written for SPA routing
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the compiled static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 (Nginx default); map to a host port at `docker run` time
EXPOSE 80

# Nginx starts in the foreground so Docker can track the process correctly
CMD ["nginx", "-g", "daemon off;"]

# Stable image to build and run a Vite app
FROM node:18-alpine

WORKDIR /app

# Install dependencies inside the container (avoid copying host node_modules)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Ensure esbuild native binary matches container environment
RUN npm rebuild esbuild || true

# Build production bundle
ENV NODE_ENV=production
RUN npm run build

# Use Vite preview server for production-like serve
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
# Etapa 1: Construcción (Build)
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
# Instalamos todas las dependencias incluyendo devDependencies para el build
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Ejecución (Runtime) - Imagen final mucho más ligera
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Copiamos solo lo necesario desde la etapa de construcción
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Instalamos solo dependencias de producción (omitiendo typescript, linters, etc.)
RUN npm install --only=production

# Cloud Run escucha en el puerto 8080 por defecto
EXPOSE 8080

CMD ["node", "dist/index.js"]
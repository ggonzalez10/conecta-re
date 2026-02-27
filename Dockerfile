# Etapa 1: Construcción (Build)
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
# Usamos el flag para resolver el conflicto de React 19 vs Next 14
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Etapa 2: Ejecución (Runtime)
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Copiamos lo necesario
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# IMPORTANTE: Aquí también necesitamos el flag para evitar el error ERESOLVE
RUN npm install --only=production --legacy-peer-deps

# Cloud Run puerto por defecto
EXPOSE 8080

CMD ["node", "dist/index.js"]
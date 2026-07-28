FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# Set placeholder URL for build-time Prisma Client generation
ENV API_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]

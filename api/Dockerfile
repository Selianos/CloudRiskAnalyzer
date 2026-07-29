FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

ARG API_DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV API_DATABASE_URL=${API_DATABASE_URL}
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]

# 1. Base image Node.js yang ringan
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package.json & package-lock.json untuk install dependencies
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy seluruh sisa kode frontend
COPY . .

# 6. Expose port Vite (default 5173)
EXPOSE 5173

# 7. Jalankan Vite dev server dengan flag --host agar bisa diakses luar kontainer
CMD ["npm", "run", "dev", "--", "--host"]
# Sử dụng Node.js LTS chính thức làm base image
FROM node:20-slim

# Tạo thư mục làm việc trong container
WORKDIR /usr/src/app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt các dependencies (bao gồm cả devDependencies nếu cần thiết cho build)
RUN npm install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Mở cổng mà ứng dụng sử dụng (dựa trên server chạy port 5002)
EXPOSE 5002

# Chạy ứng dụng
CMD ["npm", "start"]

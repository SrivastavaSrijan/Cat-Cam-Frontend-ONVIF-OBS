# Use a Node.js image
FROM node:20 AS build

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN yarn

# Copy the rest of the application
COPY . .

# Build the application
RUN yarn build
ENV REACT_APP_API_BASE_URL=http://ssvsrijan.ddns.net:5000

# Use a lightweight server for deployment
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

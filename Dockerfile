# Use a Node.js image
FROM node:20 AS build

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN yarn

# Copy the rest of the application
COPY . .

# Set the correct API base URL for Caddy routing
ENV REACT_APP_API_BASE_URL=https://ssvcam.srijansrivastava.com/api
ENV REACT_APP_MJPEG_BASE_URl=https://ssvcam.srijansrivastava.com/stream

# Build the application
RUN yarn build

# Use a lightweight server for deployment
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

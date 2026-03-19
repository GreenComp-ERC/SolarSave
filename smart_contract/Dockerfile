# Use Node.js as the base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy dependency manifests
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy smart contract project files
COPY . .

# Expose port (if needed for local network)
EXPOSE 8545

# Start Hardhat local dev network
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]

# Use Node.js as the base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock

COPY yarn.lock ./

# Install dependencies
RUN yarn install

# Copy smart contract project files
COPY . .

# Expose port (if needed for local network)
EXPOSE 8545

# Start Hardhat local dev network
CMD ["npx", "hardhat", "node"]

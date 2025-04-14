FROM node:18-alpine

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S coderunner && adduser -S coderunner -G coderunner
USER coderunner

# Set resource limits
ENV NODE_OPTIONS="--max-old-space-size=200"

# Copy the code and input files
COPY --chown=coderunner:coderunner ./code.js /app/
COPY --chown=coderunner:coderunner ./input.txt /app/

# Run the code with a timeout
CMD ["sh", "-c", "cat input.txt | node code.js"]

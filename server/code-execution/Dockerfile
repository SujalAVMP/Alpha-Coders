FROM ubuntu:22.04

# Install necessary packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /code

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Create a non-root user for running code
RUN useradd -m coderunner
USER coderunner

# Default command
CMD ["bash"]

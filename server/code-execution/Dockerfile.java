FROM openjdk:11-jdk-slim

WORKDIR /app

# Create a non-root user for security
RUN groupadd -r coderunner && useradd -r -g coderunner coderunner
USER coderunner

# Copy the code and input files
COPY --chown=coderunner:coderunner ./Main.java /app/
COPY --chown=coderunner:coderunner ./input.txt /app/

# Compile and run the code
CMD ["sh", "-c", "javac Main.java && cat input.txt | java Main"]

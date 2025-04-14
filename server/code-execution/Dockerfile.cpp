FROM gcc:latest

WORKDIR /app

# Create a non-root user for security
RUN groupadd -r coderunner && useradd -r -g coderunner coderunner
USER coderunner

# Copy the code and input files
COPY --chown=coderunner:coderunner ./code.cpp /app/
COPY --chown=coderunner:coderunner ./input.txt /app/

# Compile and run the code
CMD ["sh", "-c", "g++ -o program code.cpp && cat input.txt | ./program"]

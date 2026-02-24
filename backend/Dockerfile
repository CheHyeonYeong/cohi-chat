# Runtime-only Dockerfile (JAR is pre-built in CI)
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Install wget for healthcheck
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r spring && useradd -r -g spring spring

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R spring:spring /app

# Copy pre-built JAR (uploaded from CI)
COPY app.jar app.jar

# Change ownership to non-root user
RUN chown spring:spring app.jar

USER spring

# Expose port
EXPOSE 8080

# SQLite data volume
VOLUME ["/app/data"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget -q --spider http://localhost:8080/api/hello || exit 1

# Run application with JVM memory settings
ENTRYPOINT ["java", "-Xms256m", "-Xmx512m", "-jar", "app.jar"]

# Runtime-only Dockerfile (JAR is pre-built in CI)
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Install wget, create non-root user, and setup directories in single layer
RUN apt-get update && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r spring && useradd -r -g spring spring \
    && mkdir -p /app/data && chown -R spring:spring /app

# Copy pre-built JAR (uploaded from CI) with proper ownership
COPY --chown=spring:spring app.jar app.jar

USER spring

# Expose port
EXPOSE 8080

# SQLite data volume
VOLUME ["/app/data"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=90s --retries=3 \
  CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

# Run application with JVM memory settings
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]

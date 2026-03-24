# Runtime-only Dockerfile (JAR is pre-built in CI)
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install wget, create non-root user
RUN apk add --no-cache wget curl \
    && addgroup -S spring && adduser -S spring -G spring \
    && chown -R spring:spring /app

# Copy pre-built JAR (uploaded from CI) with proper ownership
COPY --chown=spring:spring app.jar app.jar

USER spring

# Expose port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=90s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/api/actuator/health || exit 1

# Run application with JVM memory settings
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]

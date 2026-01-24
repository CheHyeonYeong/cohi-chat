# Multi-stage build for Spring Boot application

# Stage 1: Build
FROM gradle:8.5-jdk21 AS builder

WORKDIR /app

# Copy Gradle files first for better caching
COPY build.gradle settings.gradle ./
COPY gradle gradle/

# Download dependencies (cached layer)
RUN gradle dependencies --no-daemon || true

# Copy source code
COPY src src/

# Build application
RUN gradle bootJar --no-daemon

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Create non-root user for security
RUN groupadd -r spring && useradd -r -g spring spring

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R spring:spring /app

# Copy built JAR from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Change ownership to non-root user
RUN chown spring:spring app.jar

USER spring

# Expose port
EXPOSE 8080

# SQLite 데이터 볼륨
VOLUME ["/app/data"]

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]

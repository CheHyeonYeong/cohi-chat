package com.coDevs.cohiChat.google.calendar;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class GoogleCalendarConfig {

    private static final String APPLICATION_NAME = "CoHi-Chat";
    private static final List<String> SCOPES = List.of(
        CalendarScopes.CALENDAR,
        CalendarScopes.CALENDAR_EVENTS
    );

    private final GoogleCalendarProperties properties;

    private String extractedServiceAccountEmail = null;

    @Bean
    public Calendar googleCalendar() {
        InputStream credentialsStream = getCredentialsStream();

        if (credentialsStream == null) {
            log.warn("Google Calendar credentials not available");
            return null;
        }

        try {
            GoogleCredentials baseCredentials = GoogleCredentials.fromStream(credentialsStream);

            if (baseCredentials instanceof ServiceAccountCredentials sac) {
                this.extractedServiceAccountEmail = sac.getClientEmail();
                log.info("[googleCalendarInit] [SUCCESS] credentials=SERVICE_ACCOUNT");
            }

            GoogleCredentials credentials = baseCredentials.createScoped(SCOPES);

            return new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials)
            )
                .setApplicationName(APPLICATION_NAME)
                .build();
        } catch (IOException e) {
            log.error("Failed to load Google Calendar credentials", e);
            return null;
        } catch (Exception e) {
            log.error("Failed to initialize Google Calendar service", e);
            return null;
        }
    }

    /**
     * Get credentials InputStream from file or AWS Secrets Manager.
     * Priority: 1. Local file, 2. AWS Secrets Manager
     */
    private InputStream getCredentialsStream() {
        // 1. Try local file first
        String credentialsPath = properties.getCredentialsPath();
        if (credentialsPath != null && !credentialsPath.isBlank()) {
            Path path = Paths.get(credentialsPath);
            if (Files.exists(path)) {
                try {
                    log.debug("[googleCalendarCredentials] [START] source=FILE");
                    return new FileInputStream(credentialsPath);
                } catch (IOException e) {
                    log.warn("[googleCalendarCredentials] [FAIL] source=FILE cause={}", e.getClass().getSimpleName());
                }
            } else {
                log.debug("[googleCalendarCredentials] [SKIP] source=FILE reason=NOT_FOUND");
            }
        }

        // 2. Try AWS Secrets Manager
        String secretName = properties.getCredentialsSecretName();
        if (secretName != null && !secretName.isBlank()) {
            try {
                log.info("[googleCalendarCredentials] [START] source=SECRETS_MANAGER");
                String secretJson = getSecretFromAwsSecretsManager(secretName);
                if (secretJson != null) {
                    return new ByteArrayInputStream(secretJson.getBytes(StandardCharsets.UTF_8));
                }
            } catch (Exception e) {
                log.warn("[googleCalendarCredentials] [FAIL] source=SECRETS_MANAGER cause={}",
                    e.getClass().getSimpleName());
            }
        }

        return null;
    }

    private static final String CREDENTIALS_KEY = "GOOGLE_CALENDAR_CREDENTIALS";

    /**
     * Fetch secret value from AWS Secrets Manager and extract GOOGLE_CALENDAR_CREDENTIALS key.
     */
    private String getSecretFromAwsSecretsManager(String secretName) {
        try (SecretsManagerClient client = SecretsManagerClient.create()) {
            GetSecretValueRequest request = GetSecretValueRequest.builder()
                .secretId(secretName)
                .build();

            GetSecretValueResponse response = client.getSecretValue(request);
            String secretJson = response.secretString();

            // Parse JSON and extract GOOGLE_CALENDAR_CREDENTIALS key
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(secretJson);

            if (root.has(CREDENTIALS_KEY)) {
                return root.get(CREDENTIALS_KEY).asText();
            } else {
                log.warn("[googleCalendarCredentials] [FAIL] source=SECRETS_MANAGER reason=MISSING_KEY");
                return null;
            }
        } catch (Exception e) {
            log.error("[googleCalendarCredentials] [FAIL] source=SECRETS_MANAGER cause={}",
                e.getClass().getSimpleName());
            return null;
        }
    }

    public String getServiceAccountEmail() {
        return extractedServiceAccountEmail;
    }
}

package com.coDevs.cohiChat.google.calendar;

import java.io.FileInputStream;
import java.io.IOException;
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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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

    @Bean
    public Calendar googleCalendar() {
        String credentialsPath = properties.getCredentialsPath();

        if (credentialsPath == null || credentialsPath.isBlank()) {
            log.warn("Google Calendar credentials path is not configured");
            return null;
        }

        Path path = Paths.get(credentialsPath);
        if (!Files.exists(path)) {
            log.warn("Google Calendar credentials file not found: {}", credentialsPath);
            return null;
        }

        try {
            GoogleCredentials credentials = GoogleCredentials
                .fromStream(new FileInputStream(credentialsPath))
                .createScoped(SCOPES);

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
}

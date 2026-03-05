package com.coDevs.cohiChat.google.calendar;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "google.calendar")
public class GoogleCalendarProperties {

    private String credentialsPath;
    private String defaultCalendarId;
    private String timezone = "Asia/Seoul";

    /**
     * AWS Secrets Manager secret name for Google Calendar credentials.
     * Used when credentials file is not found locally.
     */
    private String credentialsSecretName;
}

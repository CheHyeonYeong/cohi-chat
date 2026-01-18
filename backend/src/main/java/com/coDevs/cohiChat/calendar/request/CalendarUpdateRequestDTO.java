package com.coDevs.cohiChat.calendar.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarUpdateRequestDTO {

    @NotEmpty(message = "주제는 최소 1개 이상 입력해야 합니다.")
    private List<@NotBlank String> topics;

    @NotBlank(message = "설명은 필수 입력 항목입니다.")
    @Size(min = 10, message = "설명은 최소 10자 이상 입력해야 합니다.")
    private String description;

    @NotBlank(message = "Google Calendar ID는 필수 입력 항목입니다.")
    @Pattern(
        regexp = "^[a-zA-Z0-9._-]+@group\\.calendar\\.google\\.com$",
        message = "Google Calendar ID는 '<식별값>@group.calendar.google.com' 형식이어야 합니다."
    )
    private String googleCalendarId;
}

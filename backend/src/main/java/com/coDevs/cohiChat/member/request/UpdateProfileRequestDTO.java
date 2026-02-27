package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequestDTO {

	@Size(max = 100)
	private String job;

	@Size(max = 500)
	@Pattern(regexp = "^https://.*", message = "HTTPS URL만 허용됩니다")
	private String profileImageUrl;
}

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
<<<<<<< HEAD
	@Pattern(regexp = "^$|https?://.*", message = "유효하지 않은 URL 형식입니다.")
=======
	@Pattern(regexp = "^https://.*", message = "HTTPS URL만 허용됩니다")
>>>>>>> 30e3e0686e7101de034a2beb5eaaa52d7455c975
	private String profileImageUrl;
}

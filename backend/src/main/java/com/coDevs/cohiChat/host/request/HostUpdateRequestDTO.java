package com.coDevs.cohiChat.host.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class HostUpdateRequestDTO {

	@NotBlank(message = "닉네임은 필수입니다.")
	@Size(min = 1, max = 50, message = "닉네임은 1~50자여야 합니다.")
	private String displayName;
}

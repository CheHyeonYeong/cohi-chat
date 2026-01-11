package com.coDevs.cohiChat.member.request;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMemberRequestDTO {
	private String displayName;
	private String password;
}

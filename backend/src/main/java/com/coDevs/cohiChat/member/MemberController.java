package com.coDevs.cohiChat.member;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;

@Tag(name = "회원(Member)", description = "회원 정보 조회, 수정, 탈퇴 등 사용자 관리 API")
@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

	private final MemberService memberService;

	@Operation(summary = "회원 상세 조회", description = "username을 통해 특정 회원의 상세 정보를 조회합니다.")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "조회 성공"),
		@ApiResponse(responseCode = "404", description = "존재하지 않는 회원")
	})
	@GetMapping("/{username}")
	public ResponseEntity<MemberResponseDTO> getMember(
		@Parameter(description = "조회할 사용자의 아이디(username)", example = "coDevs123")
		@PathVariable(name = "username") String username) {
		Member member = memberService.getMember(username);
		MemberResponseDTO response = MemberResponseDTO.builder()
			.id(member.getId())
			.username(member.getUsername())
			.displayName(member.getDisplayName())
			.email(member.getEmail())
			.role(member.getRole())
			.createdAt(member.getCreatedAt())
			.updatedAt(member.getUpdatedAt())
			.build();

		return ResponseEntity.ok(response);
	}

	@Operation(summary = "회원 정보 수정", description = "회원의 닉네임(displayName) 등 정보를 수정합니다.")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "수정 성공"),
		@ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
		@ApiResponse(responseCode = "404", description = "존재하지 않는 회원")
	})
	@PatchMapping("/{username}")
	public ResponseEntity<MemberResponseDTO> updateMember(
		@Parameter(description = "수정할 사용자의 아이디(username)", example = "coDevs123")
		@PathVariable(name = "username") String username,
		@RequestBody UpdateMemberRequestDTO requestDto) {
		MemberResponseDTO response = memberService.updateMember(username, requestDto);

		return ResponseEntity.ok(response);
	}

	@Operation(summary = "회원 탈퇴", description = "회원 계정을 삭제합니다.")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "204", description = "탈퇴 성공 (반환 데이터 없음)"),
		@ApiResponse(responseCode = "404", description = "존재하지 않는 회원")
	})
	@DeleteMapping("/{username}")
	public ResponseEntity<Void> deleteMember(
		@Parameter(description = "탈퇴할 사용자의 아이디(username)", example = "coDevs123")
		@PathVariable(name = "username") String username) {
		memberService.deleteMember(username);

		return ResponseEntity.noContent()
			.build();
	}
}
package com.coDevs.cohiChat.member;

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
import com.coDevs.cohiChat.member.mapper.MemberMapper;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

	private final MemberService memberService;
	private final MemberMapper memberMapper;

	@GetMapping("/{username}")
	public ResponseEntity<MemberResponseDTO> getMember(
		@PathVariable(name = "username") String username) {
		Member member = memberService.getMember(username);

		return ResponseEntity.ok(memberMapper.toResponse(member));
	}

	@PatchMapping("/{username}")
	public ResponseEntity<MemberResponseDTO> updateMember(
		@PathVariable(name = "username") String username,
		@RequestBody UpdateMemberRequestDTO requestDto) {
		Member updatedMember = memberService.updateMember(username, requestDto);

		return ResponseEntity.ok(memberMapper.toResponse(updatedMember));
	}


	@DeleteMapping("/{username}")
	public ResponseEntity<Void> deleteMember(
		@PathVariable(name = "username") String username) {
		memberService.deleteMember(username);

		return ResponseEntity.noContent()
			.build();
	}
}
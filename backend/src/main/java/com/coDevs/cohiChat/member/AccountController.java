package com.coDevs.cohiChat.member;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/account")
@RequiredArgsConstructor
public class AccountController {

	private final MemberRepository memberRepository;

	@GetMapping("/hosts")
	public ResponseEntity<List<MemberResponseDTO>> getHosts() {
		List<Member> hosts = memberRepository.findByRoleAndIsDeletedFalse(Role.HOST);
		List<MemberResponseDTO> response = hosts.stream()
			.map(MemberResponseDTO::from)
			.toList();
		return ResponseEntity.ok(response);
	}
}

package com.coDevs.cohiChat.host;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.host.response.HostProfileResponseDTO;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HostService {

	private final MemberService memberService;
	private final CalendarRepository calendarRepository;

	@Transactional
	public HostProfileResponseDTO registerAsHost(String username) {
		Member member = memberService.getMember(username);
		member.promoteToHost();
		return HostProfileResponseDTO.from(member, false);
	}

	@Transactional(readOnly = true)
	public HostProfileResponseDTO getHostProfile(String username) {
		Member member = memberService.getMember(username);
		validateHostRole(member);
		boolean calendarConnected = calendarRepository.existsByMemberId(member.getId());
		return HostProfileResponseDTO.from(member, calendarConnected);
	}

	@Transactional
	public HostProfileResponseDTO updateHostProfile(String username, String displayName) {
		Member member = memberService.getMember(username);
		validateHostRole(member);
		member.updateDisplayName(displayName);
		boolean calendarConnected = calendarRepository.existsByMemberId(member.getId());
		return HostProfileResponseDTO.from(member, calendarConnected);
	}

	// TODO: [#220 정책 검토] GUEST_ACCESS_DENIED 에러코드 명확화 여부 팀 논의 필요
	//  - 현재: GUEST_ACCESS_DENIED (403) - "게스트 권한으로는 이용할 수 없는 기능입니다."
	//  - 대안: HOST_ROLE_REQUIRED 같은 명칭으로 변경하면 "호스트 역할이 필요하다"는 의미가 더 명확
	//  - CalendarService.validateHostPermission()에서도 동일 에러코드 사용 중이므로 일괄 변경 필요
	private void validateHostRole(Member member) {
		if (member.getRole() != Role.HOST) {
			throw new CustomException(ErrorCode.GUEST_ACCESS_DENIED);
		}
	}
}

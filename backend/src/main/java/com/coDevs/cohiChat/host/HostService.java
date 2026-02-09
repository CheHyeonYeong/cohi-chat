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
		boolean calendarConnected = calendarRepository.existsByUserId(member.getId());
		return HostProfileResponseDTO.from(member, calendarConnected);
	}

	@Transactional
	public HostProfileResponseDTO updateHostProfile(String username, String displayName) {
		Member member = memberService.getMember(username);
		validateHostRole(member);
		member.updateInfo(displayName, null);
		boolean calendarConnected = calendarRepository.existsByUserId(member.getId());
		return HostProfileResponseDTO.from(member, calendarConnected);
	}

	private void validateHostRole(Member member) {
		if (member.getRole() != Role.HOST) {
			throw new CustomException(ErrorCode.GUEST_ACCESS_DENIED);
		}
	}
}

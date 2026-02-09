package com.coDevs.cohiChat.host;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.host.response.HostProfileResponseDTO;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HostService {

	private final MemberRepository memberRepository;
	private final CalendarRepository calendarRepository;

	@Transactional
	public HostProfileResponseDTO registerAsHost(String username) {
		Member member = findMember(username);
		member.promoteToHost();
		boolean calendarConnected = calendarRepository.existsByUserId(member.getId());
		return HostProfileResponseDTO.from(member, calendarConnected);
	}

	@Transactional(readOnly = true)
	public HostProfileResponseDTO getHostProfile(String username) {
		Member member = findMember(username);
		validateHostRole(member);
		boolean calendarConnected = calendarRepository.existsByUserId(member.getId());
		return HostProfileResponseDTO.from(member, calendarConnected);
	}

	@Transactional
	public HostProfileResponseDTO updateHostProfile(String username, String displayName) {
		Member member = findMember(username);
		validateHostRole(member);
		member.updateInfo(displayName, null);
		boolean calendarConnected = calendarRepository.existsByUserId(member.getId());
		return HostProfileResponseDTO.from(member, calendarConnected);
	}

	private Member findMember(String username) {
		return memberRepository.findByUsernameAndIsDeletedFalse(username)
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
	}

	private void validateHostRole(Member member) {
		if (member.getRole() != Role.HOST) {
			throw new CustomException(ErrorCode.GUEST_ACCESS_DENIED);
		}
	}
}

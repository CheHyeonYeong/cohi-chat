package com.coDevs.cohiChat.hostrequest;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.hostrequest.entity.HostRequest;
import com.coDevs.cohiChat.hostrequest.entity.HostRequestStatus;
import com.coDevs.cohiChat.hostrequest.response.HostRequestResponseDTO;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HostRequestService {

	private final HostRequestRepository hostRequestRepository;
	private final MemberService memberService;

	@Transactional
	public HostRequestResponseDTO createRequest(String username) {
		Member member = memberService.getMember(username);

		if (hostRequestRepository.existsByMemberIdAndStatus(member.getId(), HostRequestStatus.PENDING)) {
			throw new CustomException(ErrorCode.HOST_REQUEST_ALREADY_EXISTS);
		}

		HostRequest hostRequest = HostRequest.create(member);
		HostRequest saved = hostRequestRepository.save(hostRequest);
		return HostRequestResponseDTO.from(saved);
	}

	@Transactional(readOnly = true)
	public List<HostRequestResponseDTO> getPendingRequests() {
		return hostRequestRepository.findByStatusWithMember(HostRequestStatus.PENDING).stream()
			.map(HostRequestResponseDTO::from)
			.toList();
	}

	@Transactional
	public HostRequestResponseDTO approveRequest(Long id) {
		HostRequest hostRequest = hostRequestRepository.findById(id)
			.orElseThrow(() -> new CustomException(ErrorCode.HOST_REQUEST_NOT_FOUND));

		hostRequest.getMember().promoteToHost();
		hostRequest.approve();
		return HostRequestResponseDTO.from(hostRequest);
	}

	@Transactional
	public HostRequestResponseDTO rejectRequest(Long id) {
		HostRequest hostRequest = hostRequestRepository.findById(id)
			.orElseThrow(() -> new CustomException(ErrorCode.HOST_REQUEST_NOT_FOUND));

		hostRequest.reject();
		return HostRequestResponseDTO.from(hostRequest);
	}
}

package com.coDevs.cohiChat.hostrequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.hostrequest.response.HostRequestResponseDTO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/members")
@RequiredArgsConstructor
public class HostRequestController {

	private final HostRequestService hostRequestService;

	@PostMapping("/v1/{username}/host-request")
	@PreAuthorize("isAuthenticated() and #username == authentication.name")
	public ResponseEntity<ApiResponseDTO<HostRequestResponseDTO>> createHostRequest(
		@PathVariable(name = "username") String username
	) {
		HostRequestResponseDTO response = hostRequestService.createRequest(username);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponseDTO.success(response));
	}
}

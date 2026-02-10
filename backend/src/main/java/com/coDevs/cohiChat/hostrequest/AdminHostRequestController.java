package com.coDevs.cohiChat.hostrequest;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.hostrequest.response.HostRequestResponseDTO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminHostRequestController {

	private final HostRequestService hostRequestService;

	@GetMapping("/host-requests")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponseDTO<List<HostRequestResponseDTO>>> getHostRequests() {
		List<HostRequestResponseDTO> response = hostRequestService.getPendingRequests();
		return ResponseEntity.ok(ApiResponseDTO.success(response));
	}

	@PatchMapping("/host-requests/{id}/approve")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponseDTO<HostRequestResponseDTO>> approveHostRequest(
		@PathVariable(name = "id") Long id
	) {
		HostRequestResponseDTO response = hostRequestService.approveRequest(id);
		return ResponseEntity.ok(ApiResponseDTO.success(response));
	}

	@PatchMapping("/host-requests/{id}/reject")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponseDTO<HostRequestResponseDTO>> rejectHostRequest(
		@PathVariable(name = "id") Long id
	) {
		HostRequestResponseDTO response = hostRequestService.rejectRequest(id);
		return ResponseEntity.ok(ApiResponseDTO.success(response));
	}
}

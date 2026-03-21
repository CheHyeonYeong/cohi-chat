package com.coDevs.cohiChat.metrics;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.metrics.response.BusinessMetricsDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Metrics", description = "비즈니스 메트릭 API")
@RestController
@RequestMapping("/metrics")
@RequiredArgsConstructor
public class MetricsController {

	private final MetricsService metricsService;

	@Operation(summary = "비즈니스 메트릭 조회", description = "회원 및 예약 관련 비즈니스 메트릭을 조회합니다. 관리자 권한이 필요합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "메트릭 조회 성공"),
		@ApiResponse(responseCode = "401", description = "인증 필요"),
		@ApiResponse(responseCode = "403", description = "관리자 권한 필요")
	})
	@GetMapping("/v1/business")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponseDTO<BusinessMetricsDTO>> getBusinessMetrics() {
		BusinessMetricsDTO metrics = metricsService.getBusinessMetrics();
		return ResponseEntity.ok(ApiResponseDTO.success(metrics));
	}
}

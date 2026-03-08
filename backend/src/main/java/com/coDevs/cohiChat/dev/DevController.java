package com.coDevs.cohiChat.dev;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.dev.dto.DummyDataRequest;
import com.coDevs.cohiChat.dev.dto.DummyDataResponse;
import com.coDevs.cohiChat.global.response.ApiResponseDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/dev")
@Profile({"local", "dev"})
@RequiredArgsConstructor
@Tag(name = "Dev", description = "개발 환경 전용 API")
public class DevController {

    private final DummyDataService dummyDataService;

    @Operation(summary = "더미 데이터 생성", description = "테스트용 더미 데이터를 생성합니다. (local/dev 환경 전용)")
    @PostMapping("/dummy-data/generate")
    public ResponseEntity<ApiResponseDTO<DummyDataResponse>> generateDummyData(
            @RequestBody(required = false) DummyDataRequest request) {
        if (request == null) {
            request = DummyDataRequest.defaults();
        }
        DummyDataResponse response = dummyDataService.generate(request);
        return ResponseEntity.ok(ApiResponseDTO.success(response));
    }

    @Operation(summary = "더미 데이터 삭제", description = "생성된 더미 데이터를 삭제합니다. (local/dev 환경 전용)")
    @DeleteMapping("/dummy-data/clear")
    public ResponseEntity<ApiResponseDTO<Void>> clearDummyData() {
        dummyDataService.clear();
        return ResponseEntity.ok(ApiResponseDTO.success(null));
    }
}

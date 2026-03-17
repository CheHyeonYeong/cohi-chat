package com.coDevs.cohiChat.global.observability;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RequestIdFilterTest {

    private final RequestIdFilter filter = new RequestIdFilter();

    @Test
    @DisplayName("요청 헤더가 없으면 서버에서 UUID request-id를 생성한다")
    void generateUuidWhenHeaderMissing() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, new MockFilterChain());

        assertThat(UUID.fromString(response.getHeader(RequestIdFilter.REQUEST_ID_HEADER))).isNotNull();
    }

    @Test
    @DisplayName("유효한 UUID 헤더가 있으면 같은 값을 request-id로 사용한다")
    void reuseIncomingUuidHeader() throws Exception {
        String requestId = UUID.randomUUID().toString();
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        request.addHeader(RequestIdFilter.REQUEST_ID_HEADER, requestId);

        filter.doFilterInternal(request, response, new MockFilterChain());

        assertThat(response.getHeader(RequestIdFilter.REQUEST_ID_HEADER)).isEqualTo(requestId);
    }

    @Test
    @DisplayName("유효하지 않은 request-id 헤더는 새 UUID로 치환한다")
    void replaceInvalidHeaderWithGeneratedUuid() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        request.addHeader(RequestIdFilter.REQUEST_ID_HEADER, "not-a-uuid");

        filter.doFilterInternal(request, response, new MockFilterChain());

        String generatedRequestId = response.getHeader(RequestIdFilter.REQUEST_ID_HEADER);
        assertThat(generatedRequestId).isNotEqualTo("not-a-uuid");
        assertThat(UUID.fromString(generatedRequestId)).isNotNull();
    }
}

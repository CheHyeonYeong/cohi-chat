package com.coDevs.cohiChat.search;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.response.HostResponseDTO;

@ExtendWith(MockitoExtension.class)
class HostSemanticSearchFacadeTest {

    @Mock
    private ObjectProvider<SemanticHostSearchService> semanticHostSearchServiceProvider;

    @Mock
    private SemanticHostSearchService semanticHostSearchService;

    @InjectMocks
    private HostSemanticSearchFacade facade;

    @Test
    void delegatesToSemanticSearchServiceWithNormalizedInputs() {
        List<HostResponseDTO> hosts = List.of(
            HostResponseDTO.builder().id(UUID.randomUUID()).username("host1").build()
        );

        when(semanticHostSearchServiceProvider.getIfAvailable()).thenReturn(semanticHostSearchService);
        when(semanticHostSearchService.searchHosts("취준 백엔", 20)).thenReturn(hosts);

        List<HostResponseDTO> result = facade.searchHosts("  취준   백엔  ", 99);

        assertThat(result).isEqualTo(hosts);
        verify(semanticHostSearchService).searchHosts("취준 백엔", 20);
    }

    @Test
    void throwsWhenQueryIsBlank() {
        assertThatThrownBy(() -> facade.searchHosts("   ", 10))
            .isInstanceOf(CustomException.class)
            .extracting("errorCode")
            .isEqualTo(ErrorCode.INVALID_INPUT);
    }

    @Test
    void throwsWhenSemanticSearchServiceIsUnavailable() {
        when(semanticHostSearchServiceProvider.getIfAvailable()).thenReturn(null);

        assertThatThrownBy(() -> facade.searchHosts("취준 백엔", 10))
            .isInstanceOf(CustomException.class)
            .extracting("errorCode")
            .isEqualTo(ErrorCode.SEMANTIC_SEARCH_UNAVAILABLE);
    }
}

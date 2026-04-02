package com.coDevs.cohiChat.search;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.HostChatCount;
import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.response.HostResponseDTO;

@ExtendWith(MockitoExtension.class)
class SemanticHostSearchServiceTest {

    @Mock
    private EmbeddingClient embeddingClient;

    @Mock
    private HostSearchQueryRepository hostSearchQueryRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private SemanticHostSearchService semanticHostSearchService;

    @Test
    void returnsHostsInSimilarityOrder() {
        UUID hostId1 = UUID.randomUUID();
        UUID hostId2 = UUID.randomUUID();

        Member host1 = Member.create("host1", "Host One", "host1@test.com", "encoded-password", Role.HOST);
        Member host2 = Member.create("host2", "Host Two", "host2@test.com", "encoded-password", Role.HOST);

        when(embeddingClient.embed("취준 백엔")).thenReturn(List.of(0.1f, 0.2f));
        when(hostSearchQueryRepository.searchByEmbedding(List.of(0.1f, 0.2f), 10)).thenReturn(List.of(
            new HostSearchHit(hostId2, 0.98),
            new HostSearchHit(hostId1, 0.95)
        ));
        when(memberRepository.findByIdInAndRoleAndIsDeletedFalse(List.of(hostId2, hostId1), Role.HOST))
            .thenReturn(List.of(withId(host1, hostId1), withId(host2, hostId2)));
        when(bookingRepository.countAttendedByHostIds(any(), any(AttendanceStatus.class))).thenReturn(List.of(
            new HostChatCount() {
                @Override
                public UUID getHostId() {
                    return hostId1;
                }

                @Override
                public Long getCount() {
                    return 3L;
                }
            }
        ));

        List<HostResponseDTO> result = semanticHostSearchService.searchHosts("취준 백엔", 10);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(hostId2);
        assertThat(result.get(1).getId()).isEqualTo(hostId1);
        assertThat(result.get(1).getChatCount()).isEqualTo(3L);
    }

    @Test
    void returnsEmptyListWhenNoHitsExist() {
        when(embeddingClient.embed("취준 백엔")).thenReturn(List.of(0.1f, 0.2f));
        when(hostSearchQueryRepository.searchByEmbedding(List.of(0.1f, 0.2f), 10)).thenReturn(List.of());

        List<HostResponseDTO> result = semanticHostSearchService.searchHosts("취준 백엔", 10);

        assertThat(result).isEmpty();
    }

    private Member withId(Member source, UUID id) {
        try {
            java.lang.reflect.Field field = Member.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(source, id);
            return source;
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}

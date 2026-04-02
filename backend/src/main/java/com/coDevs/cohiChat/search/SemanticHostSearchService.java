package com.coDevs.cohiChat.search;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.HostChatCount;
import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.response.HostResponseDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@ConditionalOnBean(EmbeddingClient.class)
public class SemanticHostSearchService {

    private final EmbeddingClient embeddingClient;
    private final HostSearchQueryRepository hostSearchQueryRepository;
    private final MemberRepository memberRepository;
    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public List<HostResponseDTO> searchHosts(String query, int limit) {
        List<Float> queryEmbedding = embeddingClient.embed(query);
        List<HostSearchHit> hits = hostSearchQueryRepository.searchByEmbedding(queryEmbedding, limit);
        if (hits.isEmpty()) {
            return List.of();
        }

        List<UUID> hostIds = hits.stream()
            .map(HostSearchHit::hostId)
            .toList();

        Map<UUID, Integer> hitOrder = new LinkedHashMap<>();
        for (int index = 0; index < hostIds.size(); index++) {
            hitOrder.put(hostIds.get(index), index);
        }

        List<Member> hosts = memberRepository.findByIdInAndRoleAndIsDeletedFalse(hostIds, Role.HOST);
        Map<UUID, Member> hostMap = hosts.stream()
            .collect(Collectors.toMap(Member::getId, member -> member));

        Map<UUID, Long> chatCounts = bookingRepository.countAttendedByHostIds(hostIds, AttendanceStatus.ATTENDED)
            .stream()
            .collect(Collectors.toMap(HostChatCount::getHostId, HostChatCount::getCount));

        return hostIds.stream()
            .map(hostMap::get)
            .filter(java.util.Objects::nonNull)
            .map(host -> HostResponseDTO.from(host, chatCounts.getOrDefault(host.getId(), 0L)))
            .sorted(java.util.Comparator.comparingInt(host -> hitOrder.getOrDefault(host.getId(), Integer.MAX_VALUE)))
            .toList();
    }
}

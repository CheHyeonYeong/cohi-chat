package com.coDevs.cohiChat.chat.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coDevs.cohiChat.chat.entity.RoomMember;

public interface RoomMemberRepository extends JpaRepository<RoomMember, UUID> {

    List<RoomMember> findByRoomId(UUID roomId);
    List<RoomMember> findByRoomIdAndDeletedAtIsNull(UUID roomId);

    Optional<RoomMember> findByRoomIdAndMemberId(UUID roomId, UUID memberId);
    Optional<RoomMember> findByRoomIdAndMemberIdAndDeletedAtIsNull(UUID roomId, UUID memberId);
}

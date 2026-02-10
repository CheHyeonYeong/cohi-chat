package com.coDevs.cohiChat.hostrequest;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.coDevs.cohiChat.hostrequest.entity.HostRequest;
import com.coDevs.cohiChat.hostrequest.entity.HostRequestStatus;

@Repository
public interface HostRequestRepository extends JpaRepository<HostRequest, Long> {

	boolean existsByMemberIdAndStatus(UUID memberId, HostRequestStatus status);

	@Query("SELECT hr FROM HostRequest hr JOIN FETCH hr.member WHERE hr.status = :status")
	List<HostRequest> findByStatusWithMember(@Param("status") HostRequestStatus status);
}

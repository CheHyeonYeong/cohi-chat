package com.coDevs.cohiChat.member.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.coDevs.cohiChat.global.config.GlobalMapperConfig;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;

@Mapper(config = GlobalMapperConfig.class)
public interface MemberMapper {

	MemberResponseDTO toResponse(Member member);

	@Mapping(target = "hashedPassword", ignore = true)
	void updateEntity(
		UpdateMemberRequestDTO dto,
		@MappingTarget Member member
	);
}
/*package com.coDevs.cohiChat.member.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.coDevs.cohiChat.member.response.MemberResponseDTO;
import com.coDevs.cohiChat.member.response.CreateMemberResponseDTO;
import com.coDevs.cohiChat.member.entity.Member;

@Mapper(componentModel = "spring")
public interface MemberMapper {

	@Mapping(target = "isHost", source = "host")
	CreateMemberResponseDTO toSignupResponse(Member member);

	@Mapping(target = "isHost", source = "host")
	MemberResponseDTO toResponse(Member member);
}*/

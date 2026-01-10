package com.coDevs.cohiChat.member.mapper;

import org.mapstruct.Mapper;

import com.coDevs.cohiChat.global.config.GlobalMapperConfig;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;

@Mapper(config = GlobalMapperConfig.class)
public interface MemberMapper {

	MemberResponseDTO toResponse(Member member);

}
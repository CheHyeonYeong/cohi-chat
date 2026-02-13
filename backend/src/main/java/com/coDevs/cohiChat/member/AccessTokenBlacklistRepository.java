package com.coDevs.cohiChat.member;

import org.springframework.data.repository.CrudRepository;

import com.coDevs.cohiChat.member.entity.AccessTokenBlacklist;

public interface AccessTokenBlacklistRepository extends CrudRepository<AccessTokenBlacklist, String> {
}

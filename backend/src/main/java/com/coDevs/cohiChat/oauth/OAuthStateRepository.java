package com.coDevs.cohiChat.oauth;

import org.springframework.data.repository.CrudRepository;

public interface OAuthStateRepository extends CrudRepository<OAuthState, String> {
}

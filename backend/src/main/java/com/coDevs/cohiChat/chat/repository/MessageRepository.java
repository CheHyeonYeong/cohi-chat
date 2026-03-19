package com.coDevs.cohiChat.chat.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coDevs.cohiChat.chat.entity.Message;

public interface MessageRepository extends JpaRepository<Message, UUID> {
}

package com.coDevs.cohiChat.file;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    FileStorageResult store(MultipartFile file);

    void delete(String filePath);

    byte[] load(String filePath);
}

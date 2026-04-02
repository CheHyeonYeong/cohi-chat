package com.coDevs.cohiChat.search;

import java.util.List;

public interface EmbeddingClient {

    List<Float> embed(String text);
}

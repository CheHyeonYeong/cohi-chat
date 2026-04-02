package com.coDevs.cohiChat.search;

import java.util.List;

public interface HostSearchQueryRepository {

    List<HostSearchHit> searchByEmbedding(List<Float> queryEmbedding, int limit);
}

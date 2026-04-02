package com.coDevs.cohiChat.search;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class JdbcHostSearchQueryRepository implements HostSearchQueryRepository {

    private static final String SEARCH_SQL = """
        SELECT host_id, 1 - (embedding <=> CAST(:queryEmbedding AS vector)) AS similarity
        FROM host_search_document
        ORDER BY embedding <=> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public List<HostSearchHit> searchByEmbedding(List<Float> queryEmbedding, int limit) {
        MapSqlParameterSource parameters = new MapSqlParameterSource()
            .addValue("queryEmbedding", toVectorLiteral(queryEmbedding))
            .addValue("limit", limit);

        return jdbcTemplate.query(SEARCH_SQL, parameters, new HostSearchHitRowMapper());
    }

    private String toVectorLiteral(List<Float> embedding) {
        return embedding.stream()
            .map(String::valueOf)
            .collect(Collectors.joining(",", "[", "]"));
    }

    private static class HostSearchHitRowMapper implements RowMapper<HostSearchHit> {

        @Override
        public HostSearchHit mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new HostSearchHit(
                rs.getObject("host_id", java.util.UUID.class),
                rs.getDouble("similarity")
            );
        }
    }
}

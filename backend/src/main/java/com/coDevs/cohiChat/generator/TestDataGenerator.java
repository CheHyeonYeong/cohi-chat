package com.coDevs.cohiChat.generator;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * cohiChat 테스트 데이터 생성기
 *
 * 실행 방법: IDE에서 main 메서드 실행 (Run 버튼 클릭)
 *
 * 기능:
 * - 호스트/게스트 사용자 대량 생성 (병렬 처리)
 * - 캘린더 & 타임슬롯 자동 생성 (DB 직접 삽입)
 * - 예약 데이터 대량 생성 (온라인/오프라인 타입)
 */
public class TestDataGenerator {

    // ==================== 설정 상수 ====================

    private static final String DEFAULT_BASE_URL = "http://localhost:8080/api";
    private static final String DEFAULT_PASSWORD = "test1234";

    // DB 설정
    private static final String DB_URL = "jdbc:postgresql://localhost:5432/cohichat";
    private static final String DB_USER = "postgres";
    private static final String DB_PASSWORD = "postgres";

    // 병렬 처리 설정
    private static final int THREAD_POOL_SIZE = 20;
    private static final int BATCH_SIZE = 1000;

    // 기본 생성 개수
    private static final int DEFAULT_HOST_COUNT = 10;
    private static final int DEFAULT_GUEST_COUNT = 100;
    private static final int DEFAULT_BOOKING_COUNT = 100;

    // ==================== 예약 템플릿 데이터 ====================

    // 캘린더에 정의된 topics와 일치해야 함
    private static final List<String> CALENDAR_TOPICS = List.of("커리어 상담", "이직 상담", "포트폴리오 리뷰");

    private static final List<BookingTemplate> BOOKING_TEMPLATES = List.of(
            new BookingTemplate(
                    "ONLINE",
                    "https://meet.google.com/test-meeting",
                    null
            ),
            new BookingTemplate(
                    "OFFLINE",
                    null,
                    "스타벅스 강남역점"
            )
    );

    // ==================== 내부 데이터 클래스 ====================

    private record BookingTemplate(
            String meetingType,
            String meetingLink,
            String location
    ) {}

    private record GeneratedUser(String username, String token, UUID id) {}

    // ==================== 인스턴스 변수 ====================

    private final HttpClient httpClient;
    private final String baseUrl;
    private final long timestamp;
    private final ExecutorService executor;

    private final AtomicInteger successCount = new AtomicInteger(0);
    private final AtomicInteger failCount = new AtomicInteger(0);

    // ==================== 생성자 ====================

    public TestDataGenerator() {
        this(DEFAULT_BASE_URL);
    }

    public TestDataGenerator(String baseUrl) {
        this.baseUrl = baseUrl;
        this.timestamp = System.currentTimeMillis();
        this.executor = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    // ==================== 메인 메서드 ====================

    public static void main(String[] args) {
        String baseUrl = DEFAULT_BASE_URL;
        int hostCount = DEFAULT_HOST_COUNT;
        int guestCount = DEFAULT_GUEST_COUNT;
        int bookingCount = DEFAULT_BOOKING_COUNT;

        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--url" -> baseUrl = args[++i];
                case "--hosts" -> hostCount = Integer.parseInt(args[++i]);
                case "--guests" -> guestCount = Integer.parseInt(args[++i]);
                case "--bookings" -> bookingCount = Integer.parseInt(args[++i]);
                case "--bulk" -> {
                    hostCount = 100_000;
                    guestCount = 100_000;
                    bookingCount = 100_000;
                }
                case "--help" -> {
                    printUsage();
                    return;
                }
            }
        }

        TestDataGenerator generator = new TestDataGenerator(baseUrl);
        generator.generate(hostCount, guestCount, bookingCount);
    }

    private static void printUsage() {
        System.out.println("사용법: TestDataGenerator [옵션]");
        System.out.println();
        System.out.println("옵션:");
        System.out.println("  --url <URL>       서버 URL (기본: http://localhost:8080/api)");
        System.out.println("  --hosts <N>       생성할 호스트 수 (기본: 10)");
        System.out.println("  --guests <N>      생성할 게스트 수 (기본: 100)");
        System.out.println("  --bookings <N>    생성할 예약 수 (기본: 100)");
        System.out.println("  --bulk            대량 생성 모드 (각 10만개)");
        System.out.println("  --help            도움말 출력");
    }

    // ==================== 생성 로직 ====================

    public void generate(int hostCount, int guestCount, int bookingCount) {
        printHeader(hostCount, guestCount, bookingCount);

        if (!checkServerHealth()) {
            logError("서버가 응답하지 않습니다. 서버를 먼저 실행해주세요.");
            shutdown();
            return;
        }
        logSuccess("서버 정상 작동 중");

        if (!checkDbConnection()) {
            logError("DB 연결 실패. PostgreSQL이 실행 중인지 확인해주세요.");
            shutdown();
            return;
        }
        logSuccess("DB 연결 성공");

        long startTime = System.currentTimeMillis();

        try {
            // 1. 호스트 생성 (병렬)
            logInfo("=== 호스트 생성 시작 ===");
            List<GeneratedUser> hosts = createUsersParallel("host", hostCount, true);
            logSuccess("호스트 생성 완료: " + hosts.size() + "명");

            // 2. 호스트에게 캘린더 & 타임슬롯 생성 (DB 직접)
            if (!hosts.isEmpty()) {
                logInfo("=== 캘린더 & 타임슬롯 생성 시작 ===");
                createCalendarsAndTimeslots(hosts);
                logSuccess("캘린더 & 타임슬롯 생성 완료");
            }

            // 3. 게스트 생성 (병렬)
            logInfo("=== 게스트 생성 시작 ===");
            List<GeneratedUser> guests = createUsersParallel("guest", guestCount, false);
            logSuccess("게스트 생성 완료: " + guests.size() + "명");

            // 4. 예약 생성
            if (bookingCount > 0 && !guests.isEmpty() && !hosts.isEmpty()) {
                logInfo("=== 예약 생성 시작 ===");
                createBookingsParallel(guests, bookingCount, hosts);
            }

            // 5. 과거 예약 생성 (노쇼 신고 테스트용)
            if (!guests.isEmpty() && !hosts.isEmpty()) {
                logInfo("=== 과거 예약 생성 시작 (노쇼 신고 테스트용) ===");
                createPastBookings(guests, hosts);
            }

            long elapsed = System.currentTimeMillis() - startTime;
            printSummary(hosts, guests, elapsed);

        } catch (Exception e) {
            logError("테스트 데이터 생성 중 오류 발생: " + e.getMessage());
            e.printStackTrace();
        } finally {
            shutdown();
        }
    }

    // ==================== DB 직접 삽입 ====================

    private boolean checkDbConnection() {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            return conn.isValid(5);
        } catch (Exception e) {
            return false;
        }
    }

    private void createCalendarsAndTimeslots(List<GeneratedUser> hosts) {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            conn.setAutoCommit(false);

            // Calendar 삽입
            String calendarSql = """
                INSERT INTO calendar (user_id, topics, description, google_calendar_id, calendar_accessible, created_at, updated_at)
                VALUES (?::uuid, ?::jsonb, ?, ?, true, ?, ?)
                ON CONFLICT (user_id) DO UPDATE SET calendar_accessible = true
                """;

            // TimeSlot 삽입
            String timeslotSql = """
                INSERT INTO time_slot (calendar_id, start_time, end_time, start_date, end_date, created_at, updated_at)
                VALUES (?::uuid, ?::time, ?::time, ?, ?, ?, ?)
                RETURNING id
                """;

            // TimeSlotWeekday 삽입
            String weekdaySql = """
                INSERT INTO time_slot_weekday (time_slot_id, weekday)
                VALUES (?, ?)
                """;

            Timestamp now = Timestamp.from(Instant.now());
            LocalDate startDate = LocalDate.now();
            LocalDate endDate = startDate.plusMonths(3);

            int count = 0;
            for (GeneratedUser host : hosts) {
                if (host.id() == null) continue;

                // Calendar 생성
                try (PreparedStatement ps = conn.prepareStatement(calendarSql)) {
                    ps.setString(1, host.id().toString());
                    ps.setString(2, "[\"커리어 상담\", \"이직 상담\", \"포트폴리오 리뷰\"]");
                    ps.setString(3, "테스트 호스트 " + host.username() + "의 커피챗입니다.");
                    ps.setString(4, host.username() + "@test-calendar.com");
                    ps.setTimestamp(5, now);
                    ps.setTimestamp(6, now);
                    ps.executeUpdate();
                }

                // TimeSlot 생성
                Long timeslotId = null;
                try (PreparedStatement ps = conn.prepareStatement(timeslotSql)) {
                    ps.setString(1, host.id().toString());
                    ps.setString(2, "09:00:00");
                    ps.setString(3, "18:00:00");
                    ps.setObject(4, startDate);
                    ps.setObject(5, endDate);
                    ps.setTimestamp(6, now);
                    ps.setTimestamp(7, now);
                    ResultSet rs = ps.executeQuery();
                    if (rs.next()) {
                        timeslotId = rs.getLong("id");
                    }
                }

                // Weekdays 생성 (월~금: 1~5)
                if (timeslotId != null) {
                    try (PreparedStatement ps = conn.prepareStatement(weekdaySql)) {
                        for (int weekday = 1; weekday <= 5; weekday++) {
                            ps.setLong(1, timeslotId);
                            ps.setInt(2, weekday);
                            ps.addBatch();
                        }
                        ps.executeBatch();
                    }
                }

                count++;
                if (count % 100 == 0) {
                    logInfo("캘린더/타임슬롯 진행: " + count + "/" + hosts.size());
                    conn.commit();
                }
            }

            conn.commit();
            logInfo("캘린더/타임슬롯 생성 완료: " + count + "개");

        } catch (Exception e) {
            logError("캘린더/타임슬롯 생성 오류: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ==================== 병렬 사용자 생성 ====================

    private List<GeneratedUser> createUsersParallel(String prefix, int count, boolean registerAsHost) {
        List<GeneratedUser> result = new ArrayList<>();
        List<CompletableFuture<GeneratedUser>> futures = new ArrayList<>();

        AtomicInteger progress = new AtomicInteger(0);

        for (int i = 0; i < count; i++) {
            final int index = i;
            CompletableFuture<GeneratedUser> future = CompletableFuture.supplyAsync(() -> {
                String username = prefix.substring(0, 1) + (timestamp % 100000) + "_" + index;
                try {
                    // 1. 회원가입
                    String signupBody = String.format("""
                        {
                            "username": "%s",
                            "password": "%s",
                            "email": "%s@test.com",
                            "displayName": "테스트 %s %d"
                        }
                        """, username, DEFAULT_PASSWORD, username, prefix, index);

                    String signupResponse = post("/members/v1/signup", signupBody, null);

                    if (signupResponse == null || !signupResponse.contains("\"success\":true")) {
                        return null;
                    }

                    // ID 추출
                    UUID userId = extractUuid(signupResponse, "id");

                    // 2. 로그인
                    String loginBody = String.format("""
                        {
                            "username": "%s",
                            "password": "%s"
                        }
                        """, username, DEFAULT_PASSWORD);

                    String loginResponse = post("/members/v1/login", loginBody, null);
                    String token = extractJsonField(loginResponse, "accessToken");
                    if (token == null) {
                        return null;
                    }

                    // 3. 호스트 등록 (호스트인 경우)
                    if (registerAsHost) {
                        post("/hosts/v1/register", "{}", token);
                    }

                    int current = progress.incrementAndGet();
                    if (current % BATCH_SIZE == 0 || current == count) {
                        logInfo(String.format("진행: %d/%d (%.1f%%)", current, count, (current * 100.0 / count)));
                    }

                    successCount.incrementAndGet();
                    return new GeneratedUser(username, token, userId);

                } catch (Exception e) {
                    failCount.incrementAndGet();
                    return null;
                }
            }, executor);

            futures.add(future);
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        for (CompletableFuture<GeneratedUser> future : futures) {
            try {
                GeneratedUser user = future.get();
                if (user != null) {
                    result.add(user);
                }
            } catch (Exception e) {
                // 무시
            }
        }

        return result;
    }

    // ==================== 병렬 예약 생성 ====================

    private void createBookingsParallel(List<GeneratedUser> guests, int count, List<GeneratedUser> hosts) {
        // 새로 생성된 호스트 중 첫 번째 호스트 사용
        GeneratedUser targetHost = null;
        String timeSlotId = null;

        for (GeneratedUser host : hosts) {
            if (host.id() != null) {
                String tsId = findTimeSlot(host.id().toString());
                if (tsId != null) {
                    targetHost = host;
                    timeSlotId = tsId;
                    break;
                }
            }
        }

        if (targetHost == null || timeSlotId == null) {
            logWarn("타임슬롯이 있는 호스트가 없습니다. 예약 생성을 건너뜁니다.");
            return;
        }

        logInfo("타임슬롯 발견: Host=" + targetHost.username() + ", TimeSlot=" + timeSlotId);

        List<CompletableFuture<Void>> futures = new ArrayList<>();
        AtomicInteger progress = new AtomicInteger(0);
        AtomicInteger bookingSuccess = new AtomicInteger(0);
        final String finalTimeSlotId = timeSlotId;

        for (int i = 0; i < count; i++) {
            final int index = i;
            final GeneratedUser guest = guests.get(i % guests.size());
            final BookingTemplate template = BOOKING_TEMPLATES.get(i % BOOKING_TEMPLATES.size());
            final String topic = CALENDAR_TOPICS.get(i % CALENDAR_TOPICS.size());

            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                try {
                    // 요일이 월~금(1~5)인 날짜 찾기
                    LocalDate bookingDate = LocalDate.now().plusDays(7 + (index % 30));
                    int dayOfWeek = bookingDate.getDayOfWeek().getValue();
                    if (dayOfWeek > 5) {
                        bookingDate = bookingDate.plusDays(8 - dayOfWeek); // 다음 월요일로
                    }

                    String description = template.meetingType().equals("ONLINE")
                            ? "온라인으로 진행하는 " + topic + "입니다."
                            : "오프라인으로 진행하는 " + topic + "입니다.";

                    StringBuilder body = new StringBuilder();
                    body.append("{");
                    body.append("\"timeSlotId\":").append(finalTimeSlotId).append(",");
                    body.append("\"when\":\"").append(bookingDate).append("\",");
                    body.append("\"topic\":\"").append(topic).append("\",");
                    body.append("\"description\":\"").append(description).append("\",");
                    body.append("\"meetingType\":\"").append(template.meetingType()).append("\"");

                    if ("ONLINE".equals(template.meetingType()) && template.meetingLink() != null) {
                        body.append(",\"meetingLink\":\"").append(template.meetingLink()).append("\"");
                    }
                    if ("OFFLINE".equals(template.meetingType()) && template.location() != null) {
                        body.append(",\"location\":\"").append(template.location()).append("\"");
                    }
                    body.append("}");

                    String response = post("/bookings", body.toString(), guest.token());

                    if (response != null && response.contains("\"success\":true")) {
                        bookingSuccess.incrementAndGet();
                    }

                    int current = progress.incrementAndGet();
                    if (current % BATCH_SIZE == 0 || current == count) {
                        logInfo(String.format("예약 진행: %d/%d (%.1f%%)", current, count, (current * 100.0 / count)));
                    }

                } catch (Exception e) {
                    // 예약 실패 - 무시
                }
            }, executor);

            futures.add(future);
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        logSuccess("예약 생성 완료: " + bookingSuccess.get() + "건");
    }

    // ==================== 과거 예약 생성 (DB 직접 삽입) ====================

    private void createPastBookings(List<GeneratedUser> guests, List<GeneratedUser> hosts) {
        GeneratedUser targetHost = null;
        Long timeSlotId = null;

        for (GeneratedUser host : hosts) {
            if (host.id() == null) continue;
            String tsIdStr = findTimeSlot(host.id().toString());
            if (tsIdStr != null) {
                targetHost = host;
                timeSlotId = Long.parseLong(tsIdStr);
                break;
            }
        }

        if (targetHost == null || timeSlotId == null) {
            logWarn("타임슬롯이 있는 호스트가 없습니다. 과거 예약 생성을 건너뜁니다.");
            return;
        }

        String sql = """
            INSERT INTO booking (time_slot_id, guest_id, booking_date, topic, description,
                attendance_status, meeting_type, meeting_link, created_at, updated_at)
            VALUES (?, ?::uuid, ?, ?, ?, 'SCHEDULED', 'ONLINE', 'https://meet.google.com/past-test', ?, ?)
            """;

        Timestamp now = Timestamp.from(Instant.now());
        // 어제 날짜 (미팅이 이미 시작된 상태)
        LocalDate yesterday = LocalDate.now().minusDays(1);

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             PreparedStatement ps = conn.prepareStatement(sql)) {

            GeneratedUser guest = guests.get(0);
            ps.setLong(1, timeSlotId);
            ps.setString(2, guest.id().toString());
            ps.setObject(3, yesterday);
            ps.setString(4, "커리어 상담");
            ps.setString(5, "[노쇼 테스트용] 어제 진행된 미팅입니다.");
            ps.setTimestamp(6, now);
            ps.setTimestamp(7, now);
            ps.executeUpdate();

            logSuccess("과거 예약 생성 완료: guest=" + guest.username() + ", host=" + targetHost.username() + ", date=" + yesterday);

        } catch (Exception e) {
            logError("과거 예약 생성 오류: " + e.getMessage());
        }
    }

    // ==================== HTTP 유틸리티 ====================

    private boolean checkServerHealth() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/members/v1/hosts"))
                    .GET()
                    .timeout(Duration.ofSeconds(5))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    private String get(String endpoint) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + endpoint))
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.body();
        } catch (Exception e) {
            return null;
        }
    }

    private String post(String endpoint, String body, String token) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + endpoint))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .timeout(Duration.ofSeconds(10));

            if (token != null) {
                builder.header("Authorization", "Bearer " + token);
            }

            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            return response.body();
        } catch (Exception e) {
            return null;
        }
    }

    private String findTimeSlot(String hostId) {
        String response = get("/timeslot/v1/hosts/" + hostId);
        return extractNumericField(response, "id");
    }

    private String extractJsonField(String json, String field) {
        if (json == null) return null;
        Pattern pattern = Pattern.compile("\"" + field + "\":\"([^\"]+)\"");
        Matcher matcher = pattern.matcher(json);
        return matcher.find() ? matcher.group(1) : null;
    }

    private String extractNumericField(String json, String field) {
        if (json == null) return null;
        Pattern pattern = Pattern.compile("\"" + field + "\":(\\d+)");
        Matcher matcher = pattern.matcher(json);
        return matcher.find() ? matcher.group(1) : null;
    }

    private UUID extractUuid(String json, String field) {
        String value = extractJsonField(json, field);
        if (value == null) return null;
        try {
            return UUID.fromString(value);
        } catch (Exception e) {
            return null;
        }
    }

    private void shutdown() {
        executor.shutdown();
    }

    // ==================== 출력 유틸리티 ====================

    private void printHeader(int hostCount, int guestCount, int bookingCount) {
        System.out.println();
        System.out.println("==============================================");
        System.out.println("    cohiChat 테스트 데이터 생성기");
        System.out.println("==============================================");
        System.out.println();
        logInfo("Base URL: " + baseUrl);
        logInfo("Thread Pool Size: " + THREAD_POOL_SIZE);
        logInfo("생성 예정: 호스트 " + hostCount + "명, 게스트 " + guestCount + "명, 예약 " + bookingCount + "건");
        System.out.println();
    }

    private void printSummary(List<GeneratedUser> hosts, List<GeneratedUser> guests, long elapsed) {
        System.out.println();
        System.out.println("==============================================");
        System.out.println("    생성 완료");
        System.out.println("==============================================");
        System.out.println();
        logInfo("소요 시간: " + (elapsed / 1000.0) + "초");
        logInfo("성공: " + successCount.get() + ", 실패: " + failCount.get());
        System.out.println();

        if (!hosts.isEmpty()) {
            System.out.println("샘플 호스트 계정:");
            System.out.println("  - Username: " + hosts.get(0).username());
            System.out.println("  - Password: " + DEFAULT_PASSWORD);
        }

        if (!guests.isEmpty()) {
            System.out.println();
            System.out.println("샘플 게스트 계정:");
            System.out.println("  - Username: " + guests.get(0).username());
            System.out.println("  - Password: " + DEFAULT_PASSWORD);
        }

        System.out.println();
        System.out.println("==============================================");
        System.out.println();
    }

    private static final String RESET = "\u001B[0m";
    private static final String RED = "\u001B[31m";
    private static final String GREEN = "\u001B[32m";
    private static final String YELLOW = "\u001B[33m";
    private static final String BLUE = "\u001B[34m";

    private void logInfo(String message) {
        System.out.println(BLUE + "[INFO]" + RESET + " " + message);
    }

    private void logSuccess(String message) {
        System.out.println(GREEN + "[SUCCESS]" + RESET + " " + message);
    }

    private void logWarn(String message) {
        System.out.println(YELLOW + "[WARN]" + RESET + " " + message);
    }

    private void logError(String message) {
        System.out.println(RED + "[ERROR]" + RESET + " " + message);
    }
}

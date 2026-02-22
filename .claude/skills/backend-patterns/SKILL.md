# Backend Development Patterns

> Source: affaan-m/everything-claude-code

## API Design Patterns

### RESTful API Structure
- Resource-based URLs with standard HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Query parameters for filtering, sorting, and pagination

### Repository Pattern
Abstract data access logic by implementing interfaces that separate data access concerns from business logic.

```java
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
}
```

### Service Layer Pattern
Isolate business logic in service classes that coordinate with repositories.

```java
@Service
public class BookingService {
    private final BookingRepository bookingRepository;
    // Business logic here
}
```

## Database Patterns

### Query Optimization
- Select only needed columns (avoid `SELECT *`)
- Use projections for read-only queries

### N+1 Query Prevention
- Use `@EntityGraph` or `JOIN FETCH`
- Batch fetch related entities

### Transaction Pattern
```java
@Transactional
public void createBooking(BookingRequest request) {
    // Atomic operations with automatic rollback on error
}
```

## Caching Strategies

### Cache-Aside Pattern
1. Check cache first
2. On miss, query database
3. Populate cache for subsequent requests

## Error Handling

### Centralized Error Handler
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
        // Unified error response
    }
}
```

### Retry with Exponential Backoff
For transient failures: 1s -> 2s -> 4s delays

## Authentication & Authorization

### JWT Validation
- Verify tokens with shared secrets
- Include user identity and roles in payload

### Role-Based Access Control
```java
@PreAuthorize("hasRole('HOST')")
public void cancelBooking(Long bookingId) { }
```

## Rate Limiting
Prevent request flooding (e.g., 100 requests/minute per user)

## Logging & Monitoring
Structured logging with context (user IDs, request IDs, timestamps)

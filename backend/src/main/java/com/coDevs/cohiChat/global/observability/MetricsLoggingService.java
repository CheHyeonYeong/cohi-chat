package com.coDevs.cohiChat.global.observability;

import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class MetricsLoggingService {

    private static final Logger log = LoggerFactory.getLogger(MetricsLoggingService.class);
    private static final long BYTES_TO_MB = 1024 * 1024;

    @Scheduled(fixedRate = 60000)
    public void logJvmMetrics() {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();

        long heapUsedMb = heapUsage.getUsed() / BYTES_TO_MB;
        long heapMaxMb = heapUsage.getMax() / BYTES_TO_MB;
        int heapPercent = heapMaxMb > 0 ? (int) (heapUsedMb * 100 / heapMaxMb) : 0;

        long gcCount = 0;
        long gcTimeMs = 0;
        for (GarbageCollectorMXBean gc : ManagementFactory.getGarbageCollectorMXBeans()) {
            gcCount += gc.getCollectionCount();
            gcTimeMs += gc.getCollectionTime();
        }

        log.info(StructuredLogMessage.of("METRIC", "JVM")
                .add("heap_used_mb", heapUsedMb)
                .add("heap_max_mb", heapMaxMb)
                .add("heap_percent", heapPercent)
                .add("gc_count", gcCount)
                .add("gc_time_ms", gcTimeMs)
                .build());
    }
}

package com.coDevs.cohiChat.search.indexing;

import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.search.document.HostSearchDocumentSource;

public interface HostIndexingService {

    HostIndexDocument build(Member member, Calendar calendar);

    HostIndexDocument build(HostSearchDocumentSource source);
}

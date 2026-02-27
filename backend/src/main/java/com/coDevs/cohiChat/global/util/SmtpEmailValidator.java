package com.coDevs.cohiChat.global.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.InitialDirContext;
import java.io.*;
import java.net.Socket;
import java.util.Hashtable;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
public class SmtpEmailValidator {

    @Async
    public CompletableFuture<Boolean> validateEmailExists(String email) {
        try {
            String domain = email.substring(email.indexOf('@') + 1);
            String mxHost = lookupMxRecord(domain);
            if (mxHost == null) {
                return CompletableFuture.completedFuture(false);
            }
            boolean result = verifyViaSmtp(mxHost, email);
            return CompletableFuture.completedFuture(result);
        } catch (Exception e) {
            log.warn("SMTP validation failed for {}, falling back to pass", email, e);
            return CompletableFuture.completedFuture(true);
        }
    }

    private String lookupMxRecord(String domain) {
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            InitialDirContext ctx = new InitialDirContext(env);
            Attributes attrs = ctx.getAttributes(domain, new String[]{"MX"});
            Attribute mxAttr = attrs.get("MX");
            if (mxAttr == null || mxAttr.size() == 0) return null;
            String mxRecord = mxAttr.get(0).toString();
            String[] parts = mxRecord.split("\\s+");
            String host = parts[parts.length - 1];
            if (host.endsWith(".")) host = host.substring(0, host.length() - 1);
            return host;
        } catch (NamingException e) {
            log.warn("MX lookup failed for domain: {}", domain);
            return null;
        }
    }

    private boolean verifyViaSmtp(String mxHost, String email) {
        try (Socket socket = new Socket(mxHost, 25)) {
            socket.setSoTimeout(5000);
            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream()));

            readResponse(reader);
            sendCommand(writer, "HELO cohechat.com");
            readResponse(reader);
            sendCommand(writer, "MAIL FROM:<noreply@cohechat.com>");
            readResponse(reader);
            sendCommand(writer, "RCPT TO:<" + email + ">");
            String response = readResponse(reader);
            sendCommand(writer, "QUIT");

            return response != null && response.startsWith("250");
        } catch (Exception e) {
            log.warn("SMTP verify failed for {}", email);
            return true;
        }
    }

    private void sendCommand(BufferedWriter writer, String command) throws IOException {
        writer.write(command + "\r\n");
        writer.flush();
    }

    private String readResponse(BufferedReader reader) throws IOException {
        return reader.readLine();
    }
}

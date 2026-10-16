package com.nmt.history.imports;

import com.nmt.history.exception.BadRequestException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Отримує HTML лише з дозволених публічних доменів. Захист від SSRF: тільки https, лише домени зі списку,
 * без облікових даних і нестандартних портів, адреса не має вказувати на локальну чи приватну мережу
 * (перевіряється й після кожного редиректу), тайм-аут і обмеження розміру відповіді.
 * Між запитами до одного сервера витримується пауза (Crawl-delay джерела).
 */
@Component
public class SafeHtmlFetcher {

    static final int MAX_BYTES = 2 * 1024 * 1024;
    static final int MAX_REDIRECTS = 3;
    static final String USER_AGENT = "HistoryNMT-Importer/1.0 (teacher-initiated, single page)";

    private final Set<String> allowedHosts;
    private final Duration timeout;
    private final long minIntervalMs;
    private final HttpClient client;
    private long lastRequestAt;

    public SafeHtmlFetcher(@Value("${app.import.allowed-hosts:zno.osvita.ua}") String allowedHosts,
                           @Value("${app.import.timeout-seconds:10}") long timeoutSeconds,
                           @Value("${app.import.min-interval-ms:3000}") long minIntervalMs) {
        this.allowedHosts = Arrays.stream(allowedHosts.split(",")).map(h -> h.trim().toLowerCase(Locale.ROOT))
                .filter(h -> !h.isEmpty()).collect(Collectors.toSet());
        this.timeout = Duration.ofSeconds(timeoutSeconds);
        this.minIntervalMs = minIntervalMs;
        this.client = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).connectTimeout(timeout).build();
    }

    /** Перевіряє адресу без мережевих запитів (крім DNS) і повертає нормалізований URI. */
    public URI validate(String raw) {
        if (raw == null || raw.isBlank() || raw.length() > 500) {
            throw new BadRequestException("Вкажіть посилання на тест");
        }
        URI uri;
        try {
            uri = new URI(raw.trim());
        } catch (URISyntaxException e) {
            throw new BadRequestException("Некоректне посилання");
        }
        if (!"https".equalsIgnoreCase(uri.getScheme())) {
            throw new BadRequestException("Підтримуються лише посилання https://");
        }
        if (uri.getUserInfo() != null || uri.getPort() != -1 || uri.getHost() == null) {
            throw new BadRequestException("Посилання не може містити логін, пароль чи порт");
        }
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        if (!allowedHosts.contains(host)) {
            throw new BadRequestException("Це джерело не підтримується. Дозволені домени: " + String.join(", ", allowedHosts));
        }
        if (uri.getRawQuery() != null || uri.getRawFragment() != null) {
            throw new BadRequestException("Використовуйте посилання на сторінку тесту без параметрів");
        }
        assertPublicAddress(host);
        return uri;
    }

    public String fetch(String raw) {
        URI uri = validate(raw);
        for (int hop = 0; hop <= MAX_REDIRECTS; hop++) {
            throttle();
            HttpResponse<InputStream> response;
            try {
                response = client.send(HttpRequest.newBuilder(uri).timeout(timeout).header("User-Agent", USER_AGENT)
                        .header("Accept", "text/html").GET().build(), HttpResponse.BodyHandlers.ofInputStream());
            } catch (IOException e) {
                throw new BadRequestException("Не вдалося отримати сторінку: джерело недоступне або відповідь надто повільна");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new BadRequestException("Отримання сторінки перервано");
            }
            int status = response.statusCode();
            if (status >= 300 && status < 400) {
                closeQuietly(response.body());
                String location = response.headers().firstValue("Location").orElse(null);
                if (location == null || hop == MAX_REDIRECTS) {
                    throw new BadRequestException("Сторінка перенаправляє забагато разів");
                }
                uri = validate(uri.resolve(location).toString());
                continue;
            }
            if (status == 401 || status == 402 || status == 403) {
                closeQuietly(response.body());
                throw new BadRequestException("Джерело вимагає авторизації чи обмежує доступ до цієї сторінки. Імпорт неможливий");
            }
            if (status != 200) {
                closeQuietly(response.body());
                throw new BadRequestException("Джерело повернуло помилку " + status);
            }
            String type = response.headers().firstValue("Content-Type").orElse("").toLowerCase(Locale.ROOT);
            if (!type.contains("text/html")) {
                closeQuietly(response.body());
                throw new BadRequestException("За цим посиланням не HTML-сторінка");
            }
            return readLimited(response.body());
        }
        throw new BadRequestException("Не вдалося отримати сторінку");
    }

    private String readLimited(InputStream in) {
        try (in; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) {
                if (out.size() + read > MAX_BYTES) {
                    throw new BadRequestException("Сторінка завелика для імпорту");
                }
                out.write(buffer, 0, read);
            }
            return out.toString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new BadRequestException("Не вдалося прочитати сторінку");
        }
    }

    private synchronized void throttle() {
        long wait = lastRequestAt + minIntervalMs - System.currentTimeMillis();
        if (wait > 0) {
            try {
                Thread.sleep(wait);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        lastRequestAt = System.currentTimeMillis();
    }

    static void assertPublicAddress(String host) {
        List<InetAddress> addresses;
        try {
            addresses = Arrays.asList(InetAddress.getAllByName(host));
        } catch (IOException e) {
            throw new BadRequestException("Не вдалося визначити адресу сервера джерела");
        }
        for (InetAddress a : addresses) {
            if (a.isAnyLocalAddress() || a.isLoopbackAddress() || a.isLinkLocalAddress() || a.isSiteLocalAddress()
                    || a.isMulticastAddress() || isUniqueLocalIpv6(a)) {
                throw new BadRequestException("Звернення до внутрішніх адрес заборонено");
            }
        }
    }

    private static boolean isUniqueLocalIpv6(InetAddress a) {
        byte[] bytes = a.getAddress();
        return bytes.length == 16 && (bytes[0] & 0xFE) == 0xFC;
    }

    private static void closeQuietly(InputStream in) {
        try {
            in.close();
        } catch (IOException ignored) {
            // ignore
        }
    }
}

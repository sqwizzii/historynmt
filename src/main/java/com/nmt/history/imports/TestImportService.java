package com.nmt.history.imports;

import com.nmt.history.dto.CreateQuestionRequest;
import com.nmt.history.dto.CreateTestRequest;
import com.nmt.history.dto.OptionRequest;
import com.nmt.history.dto.TestSummaryResponse;
import com.nmt.history.exception.BadRequestException;
import com.nmt.history.imports.ImportDtos.CreateRequest;
import com.nmt.history.imports.ImportDtos.CreateResponse;
import com.nmt.history.imports.ImportDtos.ImportedOption;
import com.nmt.history.imports.ImportDtos.ImportedQuestion;
import com.nmt.history.imports.ImportDtos.Preview;
import com.nmt.history.imports.ImportDtos.PreviewRequest;
import com.nmt.history.service.AccessPolicy;
import com.nmt.history.service.TestService;
import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Імпорт тесту у два кроки: {@link #preview} лише розбирає джерело й нічого не зберігає, {@link #create} створює тест
 * після підтвердження вчителя. Усі питання проходять ту саму перевірку, що й створені вручну.
 */
@Service
@RequiredArgsConstructor
public class TestImportService {

    private static final int MAX_QUESTIONS = 100;
    private static final Pattern HTTPS_IMAGE = Pattern.compile("^https://\\S{1,2000}$");
    private static final String ZNO_HOST = "zno.osvita.ua";

    private final SafeHtmlFetcher fetcher;
    private final TestService testService;
    private final AccessPolicy accessPolicy;

    @Value("${app.import.zno-enabled:false}")
    private boolean znoEnabled;

    public Preview preview(PreviewRequest request, String username) {
        accessPolicy.requireSubscription(accessPolicy.requireActor(username));
        String source = request.source().trim().toUpperCase(Locale.ROOT);
        return switch (source) {
            case "TEXT" -> {
                if (request.text() == null || request.text().isBlank()) {
                    throw new BadRequestException("Вставте текст тесту");
                }
                yield TextTestParser.parse(request.text());
            }
            case "URL" -> previewUrl(request.url());
            default -> throw new BadRequestException("Невідоме джерело імпорту");
        };
    }

    private Preview previewUrl(String url) {
        URI uri = fetcher.validate(url);
        if (!ZNO_HOST.equals(uri.getHost().toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Це джерело не підтримується");
        }
        if (!znoEnabled) {
            throw new BadRequestException("Імпорт із zno.osvita.ua вимкнено: угода сайту забороняє копіювання й публікацію "
                    + "матеріалів без письмового дозволу правовласника. Скористайтеся імпортом із Google Forms або вставте "
                    + "власний текст тесту. Адміністратор платформи може ввімкнути це джерело (IMPORT_ZNO_ENABLED) лише "
                    + "за наявності дозволу.");
        }
        if (!uri.getPath().matches("^/[a-z-]+/\\d+/?$")) {
            throw new BadRequestException("Вкажіть посилання на сторінку конкретного тесту, наприклад https://zno.osvita.ua/ukraine-history/848/");
        }
        return ZnoOsvitaParser.parse(fetcher.fetch(url), uri.toString());
    }

    public CreateResponse create(CreateRequest request, String username) {
        List<ImportedQuestion> questions = request.questions() == null ? List.of() : request.questions();
        if (questions.isEmpty() || questions.size() > MAX_QUESTIONS) {
            throw new BadRequestException("Кількість питань має бути від 1 до " + MAX_QUESTIONS);
        }
        TestSummaryResponse test = testService.createTest(new CreateTestRequest(request.title().trim(), request.description(),
                request.timeLimitMinutes(), request.subjectId(), request.grade(), request.scoringScale(),
                request.answerVisibilityMode()), username);
        try {
            for (int i = 0; i < questions.size(); i++) {
                try {
                    testService.createQuestion(toRequest(test.id(), questions.get(i)), username);
                } catch (BadRequestException e) {
                    throw new BadRequestException("Питання " + (i + 1) + ": " + e.getMessage());
                }
            }
        } catch (RuntimeException e) {
            testService.deleteTest(test.id(), username);
            throw e;
        }
        return new CreateResponse(test.id(), test.title(), questions.size());
    }

    private CreateQuestionRequest toRequest(Long testId, ImportedQuestion q) {
        if (q.questionType() == null || ImportDtos.UNSUPPORTED.equals(q.status())) {
            throw new BadRequestException("непідтримуваний тип завдання, видаліть його з імпорту");
        }
        if (q.questionText() == null || q.questionText().isBlank()) {
            throw new BadRequestException("порожній текст питання");
        }
        List<OptionRequest> options = (q.options() == null ? List.<ImportedOption>of() : q.options()).stream()
                .map(o -> new OptionRequest(o.optionText() == null ? "" : o.optionText().trim(), o.isCorrect(), o.matchKey(),
                        o.orderIndex(), image(o.imageUrl())))
                .toList();
        return new CreateQuestionRequest(testId, q.questionText().trim(), image(q.imageUrl()), q.questionType(),
                q.explanation() == null || q.explanation().isBlank() ? null : q.explanation().trim(), q.topic(), options,
                images(q.extraImageUrls()), q.extraMatchChoices() == null ? List.of() : q.extraMatchChoices());
    }

    private List<String> images(List<String> urls) {
        return urls == null ? List.of() : urls.stream().map(this::image).toList();
    }

    private String image(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        if (!HTTPS_IMAGE.matcher(url.trim()).matches()) {
            throw new BadRequestException("зображення дозволені лише за https-посиланням");
        }
        return url.trim();
    }
}

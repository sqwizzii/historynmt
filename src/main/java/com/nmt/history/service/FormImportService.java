package com.nmt.history.service;

import com.nmt.history.dto.CreateQuestionRequest;
import com.nmt.history.dto.CreateTestRequest;
import com.nmt.history.dto.FormImportRequest;
import com.nmt.history.dto.FormImportResponse;
import com.nmt.history.dto.FormImportResponse.Skipped;
import com.nmt.history.dto.OptionRequest;
import com.nmt.history.dto.TestSummaryResponse;
import com.nmt.history.exception.BadRequestException;
import com.nmt.history.model.QuestionType;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Створює тест із даних, експортованих зі скрипта Google Forms. Намагається імпортувати кожне питання окремо:
 * ті, що не пройшли перевірку (наприклад, у форм-квізі не позначено правильну відповідь), пропускаються зі звітом.
 * Метод навмисно не транзакційний: кожне створення питання виконується у власній транзакції.
 */
@Service
@RequiredArgsConstructor
public class FormImportService {

    private final TestService testService;

    public FormImportResponse importForm(FormImportRequest request) {
        TestSummaryResponse test = testService.createTest(new CreateTestRequest(
                request.title().trim(), blankToNull(request.description()),
                request.timeLimitMinutes() != null ? request.timeLimitMinutes() : 60));

        int imported = 0;
        List<Skipped> skipped = new ArrayList<>();
        for (FormImportRequest.Question q : request.questions()) {
            String reason = tryImport(test.id(), q);
            if (reason == null) {
                imported++;
            } else {
                skipped.add(new Skipped(shorten(q.title()), reason));
            }
        }

        if (imported == 0) {
            testService.deleteTest(test.id());
            String detail = skipped.isEmpty() ? "У формі немає питань" : skipped.get(0).reason();
            throw new BadRequestException("Не вдалося імпортувати жодного питання. " + detail);
        }
        return new FormImportResponse(test.id(), test.title(), imported, skipped);
    }

    private String tryImport(Long testId, FormImportRequest.Question q) {
        QuestionType type = switch (q.type() == null ? "" : q.type().trim().toUpperCase()) {
            case "SINGLE" -> QuestionType.SINGLE_CHOICE;
            case "MULTIPLE" -> QuestionType.MULTIPLE_CHOICE;
            default -> null;
        };
        if (type == null) {
            return "Непідтримуваний тип питання";
        }
        List<OptionRequest> options = q.options().stream()
                .filter(o -> o.text() != null && !o.text().isBlank())
                .map(o -> new OptionRequest(o.text().trim(), o.correct(), null, null, null))
                .toList();
        long correct = options.stream().filter(o -> Boolean.TRUE.equals(o.isCorrect())).count();
        if (options.size() < 2) {
            return "Потрібно щонайменше 2 варіанти";
        }
        if (correct == 0) {
            return "У формі не позначено правильну відповідь";
        }
        if (type == QuestionType.SINGLE_CHOICE && correct != 1) {
            return "Для питання з однією відповіддю позначено кілька правильних";
        }
        String text = q.title().trim() + (q.help() == null || q.help().isBlank() ? "" : "\n" + q.help().trim());
        try {
            testService.createQuestion(new CreateQuestionRequest(
                    testId, text, null, type, blankToNull(q.explanation()), null, options));
            return null;
        } catch (BadRequestException e) {
            return e.getMessage();
        }
    }

    private static String shorten(String value) {
        return value.length() > 120 ? value.substring(0, 117) + "…" : value;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

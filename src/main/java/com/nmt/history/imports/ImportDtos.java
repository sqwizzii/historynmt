package com.nmt.history.imports;

import com.nmt.history.model.AnswerVisibilityMode;
import com.nmt.history.model.QuestionType;
import com.nmt.history.model.ScoringScale;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class ImportDtos {

    private ImportDtos() {
    }

    public static final String OK = "OK";
    public static final String NEEDS_REVIEW = "NEEDS_REVIEW";
    public static final String UNSUPPORTED = "UNSUPPORTED";

    public record PreviewRequest(@NotBlank String source, @Size(max = 500) String url, @Size(max = 200_000) String text) {
    }

    public record ImportedOption(String optionText, Boolean isCorrect, String matchKey, Integer orderIndex, String imageUrl) {
    }

    /** status: OK, NEEDS_REVIEW (відповідь не визначено надійно) або UNSUPPORTED (тип не підтримується; questionType = null). */
    public record ImportedQuestion(String questionText, String imageUrl, QuestionType questionType, String topic,
                                   String explanation, List<ImportedOption> options, String status, String note) {
    }

    public record Preview(String title, String description, String source, String notice,
                          List<ImportedQuestion> questions, List<String> warnings) {
    }

    public record CreateRequest(@NotBlank @Size(max = 255) String title, String description, Integer timeLimitMinutes,
                                Long subjectId, Integer grade, ScoringScale scoringScale,
                                AnswerVisibilityMode answerVisibilityMode, List<ImportedQuestion> questions) {
    }

    public record CreateResponse(Long testId, String title, int created) {
    }
}

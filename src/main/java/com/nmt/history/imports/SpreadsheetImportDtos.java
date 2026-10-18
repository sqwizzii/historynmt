package com.nmt.history.imports;

import com.nmt.history.model.QuestionType;
import java.util.List;

public final class SpreadsheetImportDtos {

    private SpreadsheetImportDtos() {
    }

    public record PreviewResponse(
            List<PreviewQuestion> questions,
            List<RowError> errors,
            int rowCount,
            boolean canImport) {
    }

    public record PreviewQuestion(
            int row,
            QuestionType questionType,
            String questionText,
            String explanation,
            String topic,
            Integer maxPoints,
            List<PreviewOption> options) {
    }

    public record PreviewOption(
            String optionText,
            Boolean isCorrect,
            String matchKey,
            Integer orderIndex) {
    }

    public record RowError(int row, String message) {
    }

    public record ImportResult(int imported, Long testId) {
    }
}

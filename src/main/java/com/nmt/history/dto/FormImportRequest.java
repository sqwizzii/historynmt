package com.nmt.history.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Тест, експортований зі скрипта Google Forms (див. docs/google-forms-import.md). */
public record FormImportRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 5000) String description,
        @Min(1) @Max(300) Integer timeLimitMinutes,
        @NotEmpty @Size(max = 300) @Valid List<Question> questions) {

    public record Question(
            @NotBlank String title,
            String help,
            @NotBlank String type,
            String explanation,
            @NotNull @Size(max = 30) @Valid List<Option> options) {
    }

    public record Option(String text, boolean correct) {
    }
}

package com.nmt.history.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public record TestSubmitRequest(
        @NotNull @Valid List<AnswerRequest> answers,
        @Pattern(regexp = "^(MANUAL|TIMEOUT|LEFT_PAGE)$") String endReason) {
}

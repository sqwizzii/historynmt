package com.nmt.history.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record TestSubmitRequest(@NotNull @Valid List<AnswerRequest> answers) {
}

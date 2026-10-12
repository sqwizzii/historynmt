package com.nmt.history.dto;

import java.util.List;

public record MistakesResponse(int total, List<QuestionResponse> questions) {
}

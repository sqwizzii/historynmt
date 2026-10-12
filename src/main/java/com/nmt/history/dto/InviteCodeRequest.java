package com.nmt.history.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record InviteCodeRequest(
        @NotBlank @Pattern(regexp = "^[A-Za-z0-9А-Яа-яІіЇїЄєҐґ]{6,20}$",
                message = "Код: 6-20 літер або цифр без пробілів") String code) {
}

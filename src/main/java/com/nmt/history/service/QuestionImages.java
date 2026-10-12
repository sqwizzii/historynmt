package com.nmt.history.service;

import com.nmt.history.model.Option;
import com.nmt.history.model.Question;
import java.util.regex.Pattern;

/** Завантажені файли зберігаються в БД як data-URL, а клієнтам віддаються за коротким посиланням. */
public final class QuestionImages {

    public static final Pattern OWN_URL = Pattern.compile("^/api/tests/questions/\\d+/image$");

    public static final Pattern OWN_OPTION_URL = Pattern.compile("^/api/tests/options/(\\d+)/image$");

    private QuestionImages() {
    }

    public static String publicUrl(Option option) {
        String url = option.getImageUrl();
        if (url != null && url.startsWith("data:")) {
            return "/api/tests/options/" + option.getId() + "/image";
        }
        return url;
    }

    public static String publicUrl(Question question) {
        String url = question.getImageUrl();
        if (url != null && url.startsWith("data:")) {
            return "/api/tests/questions/" + question.getId() + "/image";
        }
        return url;
    }
}

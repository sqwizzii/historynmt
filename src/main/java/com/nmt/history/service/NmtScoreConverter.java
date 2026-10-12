package com.nmt.history.service;

import org.springframework.stereotype.Component;

/**
 * Переводить первинний бал у шкалу НМТ 100-200.
 * Використовується лінійна шкала; за потреби її можна замінити таблицею відповідності.
 */
@Component
public class NmtScoreConverter {

    public static final int MIN_NMT_SCORE = 100;
    public static final int MAX_NMT_SCORE = 200;

    public int convert(int rawScore, int maxScore) {
        if (maxScore <= 0 || rawScore <= 0) {
            return MIN_NMT_SCORE;
        }
        int bounded = Math.min(rawScore, maxScore);
        double ratio = (double) bounded / maxScore;
        return MIN_NMT_SCORE + (int) Math.round(ratio * (MAX_NMT_SCORE - MIN_NMT_SCORE));
    }
}

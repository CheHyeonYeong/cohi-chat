package com.coDevs.cohiChat.timeslot.validation;

import java.util.List;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class WeekdaysValidator implements ConstraintValidator<ValidWeekdays, List<Integer>> {

    @Override
    public boolean isValid(List<Integer> weekdays, ConstraintValidatorContext context) {
        if (weekdays == null) {
            return true; // @NotEmpty handles null check
        }

        for (Integer weekday : weekdays) {
            if (weekday == null || weekday < 0 || weekday > 6) {
                return false;
            }
        }
        return true;
    }
}

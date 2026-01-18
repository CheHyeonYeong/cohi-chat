package com.coDevs.cohiChat.timeslot.validation;

import com.coDevs.cohiChat.timeslot.request.TimeSlotCreateRequestDTO;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class TimeSlotValidator implements ConstraintValidator<ValidTimeSlot, TimeSlotCreateRequestDTO> {

    @Override
    public boolean isValid(TimeSlotCreateRequestDTO dto, ConstraintValidatorContext context) {
        if (dto.getStartTime() == null || dto.getEndTime() == null) {
            return true; // @NotNull handles null check
        }

        return dto.getStartTime().isBefore(dto.getEndTime());
    }
}

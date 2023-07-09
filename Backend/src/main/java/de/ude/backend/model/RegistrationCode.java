package de.ude.backend.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@AllArgsConstructor
@Document(collection = "registrationCodes")
public class RegistrationCode {
    @NonNull
    @Id
    private final String code;
    @NonNull
    private final String studyName;
}

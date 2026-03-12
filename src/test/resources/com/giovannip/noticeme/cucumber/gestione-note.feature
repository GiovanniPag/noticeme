Feature: Gestione delle note

  Scenario: Creazione di una nota con due tag
    Given l'utente autenticato ha creato i tag "Studio" e "Lavoro"
    When crea una nota con titolo "Preparare esame"
    And associa i tag "Studio" e "Lavoro"
    Then la nota deve essere salvata con 2 tag associati
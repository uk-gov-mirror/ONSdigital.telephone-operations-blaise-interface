Feature: Cati dashboard link

  Scenario: Following the Cati dashboard link takes a user to the case info page
  Given I access the Telephone Operations Blaise Interface URL
  When I click the link to the CATI dashboard
  Then I arrive at the Case Info tab URL

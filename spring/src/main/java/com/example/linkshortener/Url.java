package com.example.linkshortener;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Url {

  @Id
  @GeneratedValue(strategy=GenerationType.IDENTITY)
  private Long id;
  private String original;
  private String shortened;

  @Override
  public String toString() {
    return String.format(
        "Url[id=%d, original='%s', shortened='%s']",
        id, original, shortened);
  }

  public Long getId() {
    return id;
  }

  public String getOriginal() {
    return original;
  }

  public String getShortened() {
    return shortened;
  }

  public Url(String original) {
    this.original = original;
    this.shortened = randomShortName();
  }

  private String randomShortName() {
    return "abced";
  }
}

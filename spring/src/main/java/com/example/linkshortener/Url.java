package com.example.linkshortener;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import java.util.Random;

@Entity
public class Url {

  @Id
  @GeneratedValue(strategy=GenerationType.IDENTITY)
  private Long id;
  private String original;

  @Column(unique = true)
  private String shortened;
  public String shortenedUrl;

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

  public void setShortenedUrl(String shortenedUrl) {
    this.shortenedUrl = shortenedUrl;
  }

  public void setShortened(String shortened) {
    this.shortened = shortened;
  }

  protected Url() {}

  public Url(String original) {
    this.original = original.startsWith("http://") || original.startsWith("https://") 
      ? original 
      : "https://" + original;
    this.shortened = randomShortName();
  }

  private String randomShortName() {
    String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    StringBuilder sb = new StringBuilder();
    Random random = new Random();
    for (int i = 0; i < 6; i++) {
      int index = random.nextInt(chars.length());
      sb.append(chars.charAt(index));
    }
    return sb.toString();
  }
}

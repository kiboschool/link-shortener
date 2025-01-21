package main

import (
    "math/rand"
    "time"
    "database/sql"
    "net/http"
    "html/template"
    _ "modernc.org/sqlite"
)

var templates = template.Must(template.ParseGlob("templates/*.html"))

type URL struct {
    ID          int64
    Short       string
    ShortURL    string
    Original string
    CreatedAt   time.Time
}

func initDB(db *sql.DB) error {
    createTable := `
    CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        short_url TEXT NOT NULL,
        original_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`
    
    _, err := db.Exec(createTable)
    return err
}

func createURL(db *sql.DB, originalURL string, shortURL string) error {
    _, err := db.Exec(`
        INSERT INTO urls (original_url, short_url) 
        VALUES (?, ?)`,
        originalURL, shortURL)
    return err
}

func getURL(db *sql.DB, shortURL string) (string, error) {
    var originalURL string
    err := db.QueryRow(`
        SELECT original_url 
        FROM urls 
        WHERE short_url = ?`,
        shortURL).Scan(&originalURL)
    return originalURL, err
}

func listURLs(db *sql.DB) ([]URL, error) {
    rows, err := db.Query(`
        SELECT short_url, original_url, created_at 
        FROM urls 
        ORDER BY created_at DESC`)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var urls []URL
    for rows.Next() {
        var u URL
        err := rows.Scan(&u.Short, &u.Original, &u.CreatedAt)
        if err != nil {
            return nil, err
        }
        urls = append(urls, u)
    }
    return urls, nil
}

func handleRedirect(w http.ResponseWriter, r *http.Request, db *sql.DB) {
    shortURL := r.URL.Path[1:]
    originalURL, err := getURL(db, shortURL)
    if err != nil {
        http.Error(w, "URL not found", http.StatusNotFound)
        return
    }
    http.Redirect(w, r, originalURL, http.StatusFound)
}

const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

func generateRandomString() string {
  b := make([]byte, 8)
  for i := range b {
    b[i] = letters[rand.Intn(len(letters))]
  }
  return string(b)
}

func main() {
    db, _ := sql.Open("sqlite", "urls.db")
    
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
      if r.Method == http.MethodGet {
        // render the form to create a url
        templates.ExecuteTemplate(w, "new.html", nil)
      } else if r.Method == http.MethodPost {
        // handle the form submission
        if err := r.ParseForm(); err != nil {
          http.Error(w, "Could not parse form", http.StatusBadRequest)
          return
        }
        url := r.FormValue("url")
        shortUrl := generateRandomString()
        createURL(db, url, shortUrl)
        data := struct {
          Original string
          ShortenedUrl string
        } {
          url,
          shortUrl,
        }
        templates.ExecuteTemplate(w, "created.html", data);
      } else {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
      }
    })

    fs := http.FileServer(http.Dir("public"))
    http.Handle("/public/", http.StripPrefix("/public/", fs))
    http.ListenAndServe(":8080", nil)
}

from django.db import models

class Url(models.Model):
    original = models.CharField(max_length=200)
    shortened = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = "urls"

    def __str__(self):
        return f"original: {self.original}, shortened: {self.shortened}"
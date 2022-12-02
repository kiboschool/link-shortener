from django.db import models

# Create your models here.

class Url(models.Model):
    original = models.CharField(max_length=200)
    shortened = models.CharField(max_length=200)
    created_at = models.DateTimeField()
    class Meta:
        db_table = "urls"

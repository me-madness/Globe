from django.urls import path
from . import views

urlpatterns = [
    path('', views.index),
    path('api/markers/', views.get_markers),
    path('api/add-marker/', views.add_marker),
    path('api/delete-marker/<int:marker_id>/', views.delete_marker),
]

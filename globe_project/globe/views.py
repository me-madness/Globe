from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Marker
import json
from django.contrib.auth.decorators import login_required

# Create your views here.
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Marker

def index(request):
    return render(request, 'globe/index.html')

def get_markers(request):
    markers = Marker.objects.all()
    data = list(markers.values('latitude', 'longitude'))
    return JsonResponse(data, safe=False)

@login_required
@csrf_exempt
def add_marker(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        
        latitude=data['lat'],
        longitude=data['lon']
        name = data.get('name', '')
            
        Marker.objects.create(
            user=request.user,
            latitude=latitude,
            longitude=longitude,
            name=name
        )
        
        return JsonResponse({'status': 'ok'})



@login_required
@csrf_exempt
def delete_marker(request, marker_id):
    Marker.objects.filter(id=marker_id, user=request.user).delete()
    return JsonResponse({'status': 'deleted'})
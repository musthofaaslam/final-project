import time
import json
from django.conf import settings
from django.http import StreamingHttpResponse
import logging
import asyncio
from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    REST API Endpoint sederhana untuk cek status server
    """
    return Response({
        "status": "online",
        "service": "Django ASGI Backend",
        "message": "REST API Communication Success!",
        "timestamp": time.time()
    }, status=status.HTTP_200_OK)


def event_stream():
    # Ambil instance dari settings secara langsung
    pubsub = settings.REDIS_CLIENT.pubsub()
    pubsub.subscribe('global_live_events')
    
    yield "data: {\"status\": \"connected\"}\n\n"

    for message in pubsub.listen():
        if message['type'] == 'message':
            data = message['data'].decode('utf-8')
            yield f"data: {data}\n\n"
logger = logging.getLogger(__name__)

# Hilangkan decorator @api_view dari fungsi async SSE agar tidak dibenturkan dengan DRF Wrapper
async def event_stream():
    # Inisialisasi pubsub secara async
    pubsub = settings.REDIS_CLIENT.pubsub()
    await pubsub.subscribe('global_live_events')
    
    try:
        # Kirim pesan awal koneksi
        yield "data: {\"status\": \"connected\"}\n\n"

        while True:
            # Ambil pesan secara non-blocking
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message['type'] == 'message':
                data = message['data'].decode('utf-8')
                yield f"data: {data}\n\n"
            
            # Beri jeda kecil agar loop tidak memakan 100% CPU
            await asyncio.sleep(0.01)

    except asyncio.CancelledError:
        # Menangani kondisi jika React/Browser menutup koneksi (disconnect)
        logger.info("SSE Client disconnected")
    finally:
        await pubsub.unsubscribe('global_live_events')


def sse_stream(request):
    """
    View biasa (tanpa decorator DRF @api_view) untuk mengembalikan StreamingHttpResponse
    """
    response = StreamingHttpResponse(
        event_stream(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    response['Connection'] = 'keep-alive'
    return response


# Untuk trigger_event (POST), diubah sedikit menggunakan await untuk publish
@api_view(['POST'])
@permission_classes([AllowAny])
async def trigger_event(request):
    msg_text = request.data.get('message', 'Default Live Message')
    payload = {
        "event": "notification",
        "message": msg_text
    }
    
    try:
        # Publish pesan secara async
        await settings.REDIS_CLIENT.publish('global_live_events', json.dumps(payload))
        return Response({"status": "published", "detail": msg_text}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"error": str(e), "message": "Gagal terhubung ke Redis PubSub"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
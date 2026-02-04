import asyncio

import websockets
from websockets.server import serve

from pyremoteplay.receiver import AVReceiver


class WsReceiver(AVReceiver):
	def __init__(self, loop, websocket):
		super().__init__()
		self._websocket = websocket
		self._loop = loop
		self._alive = 0
		self._queue_size = 0
		self._handler = None

	def handle_video_data(self, buf: bytes):
		"""Handle video data."""			
		self._loop.create_task(self._send_by_websocket(buf))

	def handle_audio_data(self, buf: bytes):
		"""Handle audio data."""
		self._loop.create_task(self._send_by_websocket(buf))

	def set_websocket(self, websocket):
		self._websocket = websocket
		self._queue_size = 0

	async def is_alive(self):
		prev_alive = self._alive
		await asyncio.sleep(3)
		return self._alive > prev_alive

	async def _send_by_websocket(self, buf):
		if self._websocket.closed and self._queue_size == -1:
			return
		self._alive += 1
		self._queue_size += 1
		if self._queue_size > 1000 and self._queue_size != -1:
			try:
				print("Queue size exceed. Connection will be closed")
				self.queue_size = -1
				await self._websocket.close()
			except:
				return
		try:
			await self._websocket.send(buf) 
		except:
			pass
		if self._queue_size != -1:
			self._queue_size -= 1
